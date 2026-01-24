/**
 * Polygon Drawing Screen
 * Allow supervisors to draw polygon boundaries for plots
 * Mobile-optimized with full-screen map and bottom sheet
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Mapbox from '@rnmapbox/maps';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '../../theme';
import { H3, Body, BodySmall, BodySemibold, Spinner, Card, Spacer } from '../../components/ui';
import {
  PolygonMapbox,
  DrawingControls,
  TaskBottomSheet,
} from '../../components/supervisor';
import { useUser } from '../../libs/auth';
import { ROLES } from '../../libs/authorization';
import {
  getPolygonTasks,
  getPlots,
  completePolygonTask,
  validatePolygonArea,
  updatePlot,
  PolygonTask,
  PlotDTO,
  ValidatePolygonAreaResponse,
} from '../../libs/supervisor';
import {
  getCoordinatesFromGeoJSON,
  calculatePolygonArea,
  createPolygonGeoJSON,
  createPolygonWKT,
} from '../../utils/polygon-utils';
import { Coordinate } from '../../types/coordinates';

const greenTheme = {
  primary: '#2E7D32', // Forest green
  primaryLight: '#4CAF50', // Medium green
  primaryLighter: '#E8F5E9', // Light green background
  accent: '#66BB6A', // Accent green
  success: '#10B981', // Success green
  background: '#F1F8F4', // Very light green tint
  cardBackground: '#FFFFFF',
  border: '#C8E6C9', // Light green border
};

// Geocoding function to search locations using Nominatim
type GeocodeResult = {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
};

const searchLocation = async (query: string): Promise<GeocodeResult[]> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SRPW-AI-Mobile/1.0', // Required by Nominatim
        },
      },
    );
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.warn('Geocoding failed:', error);
    return [];
  }
};

export const PolygonDrawingScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const mapRef = useRef<Mapbox.MapView | null>(null);
  const cameraRef = useRef<Mapbox.Camera | null>(null);
  
  // Check if user is a supervisor
  const isSupervisor = user?.role === ROLES.Supervisor || (user?.role as string) === 'Supervisor';

  const [selectedTask, setSelectedTask] = useState<PolygonTask | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<Coordinate[]>([]);
  const [polygonArea, setPolygonArea] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'tasks' | 'completed'>('tasks');
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [focusedPlotId, setFocusedPlotId] = useState<string | null>(null);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidatePolygonAreaResponse['data'] | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [editingPlot, setEditingPlot] = useState<PlotDTO | null>(null);
  const [lockedZoomLevel, setLockedZoomLevel] = useState<number | null>(null);
  const [tappedPlot, setTappedPlot] = useState<{ plot: PlotDTO; coordinate: Coordinate } | null>(null);
  const plotPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  // Queries
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks, error: tasksError } = useQuery({
    queryKey: ['polygon-tasks'],
    queryFn: getPolygonTasks,
    enabled: isSupervisor, // Only fetch if user is a supervisor
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors (authentication issues)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const { data: plots = [], isLoading: plotsLoading, refetch: refetchPlots } = useQuery({
    queryKey: ['plots', { page: 1, size: 500 }],
    queryFn: getPlots,
  });

  // Get current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.warn('Error getting current location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  const completeTaskMutation = useMutation({
    mutationFn: ({ taskId, polygonGeoJson, notes }: { taskId: string; polygonGeoJson: string; notes?: string }) =>
      completePolygonTask(taskId, polygonGeoJson, notes),
    onSuccess: async () => {
      console.log('✅ Task completed successfully');
      
      // Clear all drawing states
      setSelectedTask(null);
      setIsDrawing(false);
      setDrawnPolygon([]);
      setPolygonArea(0);
      setValidationResult(null);
      setIsValidating(false);
      setFocusedPlotId(null);
      setLockedZoomLevel(null);
      
      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      queryClient.invalidateQueries({ queryKey: ['polygon-tasks'] });
      
      // Wait a tiny bit for the backend to propagate changes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refetch the data
      await Promise.all([refetchPlots(), refetchTasks()]);
      
      console.log('🔄 Data refetched after task completion');
      Alert.alert('Thành công', 'Đã hoàn thành công việc đa giác thành công!');
    },
    onError: (error: any) => {
      console.error('❌ Error completing task:', error);
      Alert.alert('Lỗi', error.message || 'Không thể hoàn thành công việc');
    },
  });

  const updatePlotMutation = useMutation({
    mutationFn: updatePlot,
    onSuccess: async () => {
      console.log('✅ Plot updated successfully');
      
      // Clear all drawing states
      setEditingPlot(null);
      setSelectedTask(null);
      setIsDrawing(false);
      setDrawnPolygon([]);
      setPolygonArea(0);
      setValidationResult(null);
      setIsValidating(false);
      setFocusedPlotId(null);
      setLockedZoomLevel(null);
      
      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      queryClient.invalidateQueries({ queryKey: ['polygon-tasks'] });
      
      // Wait a tiny bit for the backend to propagate changes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refetch the data
      await Promise.all([refetchPlots(), refetchTasks()]);
      
      console.log('🔄 Data refetched after update');
      Alert.alert('Thành công', 'Đã cập nhật ranh giới thửa thành công!');
    },
    onError: (error: any) => {
      console.error('❌ Error updating plot:', error);
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật thửa');
    },
  });

  const completedPlots = useMemo(() => {
    return plots.filter((plot) => plot.boundaryGeoJson);
  }, [plots]);

  const plotCenters = useMemo(() => {
    return plots
      .map((plot) => {
        if (!plot.coordinateGeoJson) return null;
        return getCoordinatesFromGeoJSON(plot.coordinateGeoJson);
      })
      .filter((coord): coord is { latitude: number; longitude: number } => coord !== null);
  }, [plots]);

  const initialRegion = plotCenters.length > 0
    ? {
        latitude: plotCenters[0].latitude,
        longitude: plotCenters[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 10.8231,
        longitude: 106.6297,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  const handleMapPress = (coordinate: Coordinate) => {
    // Close search results when tapping map
    if (showSearchResults) {
      setShowSearchResults(false);
    }
    
    // Clear tapped plot when tapping empty area (with small delay to avoid clearing plot tag immediately)
    if (plotPressTimeoutRef.current) {
      clearTimeout(plotPressTimeoutRef.current);
      plotPressTimeoutRef.current = null;
    }
    
    // Delay clearing to allow plot press to set the tag first
    plotPressTimeoutRef.current = setTimeout(() => {
      setTappedPlot(null);
    }, 100);
    
    // Allow drawing for both task AND editing modes
    if (!isDrawing || (!selectedTask && !editingPlot)) {
      console.log('⚠️ Map press ignored:', { isDrawing, hasTask: !!selectedTask, hasEditingPlot: !!editingPlot });
      return;
    }

    console.log('📍 Map pressed, adding point');
    const newPolygon = [...drawnPolygon, coordinate];
    setDrawnPolygon(newPolygon);

    if (newPolygon.length >= 3) {
      const area = calculatePolygonArea(newPolygon);
      setPolygonArea(area);
      
      // Auto-validate when polygon has 3+ points
      validatePolygon(newPolygon);
    } else {
      // Clear validation if less than 3 points
      setValidationResult(null);
    }
  };

  const handlePlotPress = (plot: PlotDTO, coordinate: Coordinate) => {
    console.log('📍 Plot pressed:', plot.plotId, `(${plot.soThua}/${plot.soTo})`);
    
    // Cancel any pending map press timeout
    if (plotPressTimeoutRef.current) {
      clearTimeout(plotPressTimeoutRef.current);
      plotPressTimeoutRef.current = null;
    }
    
    // Don't show plot tag if drawing (to avoid interference)
    if (isDrawing) {
      // If drawing, treat plot tap as regular map press
      handleMapPress(coordinate);
      return;
    }
    
    // Show plot information tag
    console.log('📋 Setting tapped plot:', plot);
    setTappedPlot({ plot, coordinate });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setTappedPlot(null);
    }, 5000);
  };

  const validatePolygon = async (polygon: Coordinate[]) => {
    const plotId = selectedTask?.plotId || editingPlot?.plotId;
    if (!plotId || polygon.length < 3) return;

    setIsValidating(true);
    try {
      const geoJsonString = createPolygonGeoJSON(polygon);
      const validationData = await validatePolygonArea({
        plotId: plotId,
        polygonGeoJson: geoJsonString,
        tolerancePercent: 10,
      });

      // API client automatically unwraps Result<T>, so validationData is the actual data
      setValidationResult(validationData);
      console.log('Validation result:', validationData);
    } catch (error: any) {
      console.error('Error validating polygon:', error);
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const startDrawingForTask = (task: PolygonTask) => {
    setSelectedTask(task);
    setIsDrawing(true);
    setDrawnPolygon([]);
    setPolygonArea(0);
    setValidationResult(null);
    setIsValidating(false);
    setBottomSheetExpanded(false);

    const plot = plots.find((p) => p.plotId === task.plotId);
    if (plot && cameraRef.current) {
      const coord = getCoordinatesFromGeoJSON(plot.coordinateGeoJson || '');
      if (coord) {
        const zoomLevel = 16;
        setLockedZoomLevel(zoomLevel);
        cameraRef.current.setCamera({
          centerCoordinate: [coord.longitude, coord.latitude],
          zoomLevel: zoomLevel,
          animationDuration: 1000,
        });
      }
    }
  };

  const startEditingPlot = (plot: PlotDTO) => {
    console.log('🖊️ Starting to edit plot:', plot.plotId, `(${plot.soThua}/${plot.soTo})`);
    setEditingPlot(plot);
    setSelectedTask(null);
    setIsDrawing(true);
    setDrawnPolygon([]);
    setPolygonArea(0);
    setValidationResult(null);
    setIsValidating(false);
    setBottomSheetExpanded(false);
    // Don't move camera - let user navigate manually
  };

  const cancelDrawing = () => {
    setSelectedTask(null);
    setEditingPlot(null);
    setIsDrawing(false);
    setDrawnPolygon([]);
    setPolygonArea(0);
    setValidationResult(null);
    setIsValidating(false);
    setLockedZoomLevel(null);
    setBottomSheetExpanded(true);
  };

  const finishDrawing = () => {
    console.log('💾 Attempting to save polygon...');
    
    if (drawnPolygon.length < 3) {
      Alert.alert('Lỗi', 'Đa giác phải có ít nhất 3 điểm');
      return;
    }

    // Check validation result
    if (!validationResult) {
      Alert.alert('Cần Xác thực', 'Vui lòng đợi xác thực đa giác hoàn tất');
      return;
    }

    // STRICT: Validation must pass to save
    if (!validationResult.isValid) {
      console.log('❌ Validation failed, cannot save');
      Alert.alert(
        'Xác thực Thất bại',
        `${validationResult.message}\n\nDiện tích Vẽ: ${validationResult.drawnAreaHa} ha\nDiện tích Thửa: ${validationResult.plotAreaHa} ha\nChênh lệch: ${validationResult.differencePercent.toFixed(1)}%\nTối đa Cho phép: ${validationResult.tolerancePercent}%\n\nVui lòng vẽ lại đa giác với diện tích đúng.`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Validation passed - proceed with save
    console.log('✅ Validation passed, proceeding with save');
    
    if (selectedTask) {
      // Task drawing flow
      console.log('📋 Completing task:', selectedTask.id);
      const geoJsonString = createPolygonGeoJSON(drawnPolygon);
      completeTaskMutation.mutate({
        taskId: selectedTask.id,
        polygonGeoJson: geoJsonString,
        notes: `Polygon drawn with area: ${validationResult.drawnAreaHa}ha (${polygonArea}m²)`,
      });
    } else if (editingPlot) {
      // Plot editing flow
      console.log('✏️ Updating plot:', editingPlot.plotId);
      const wktPolygon = createPolygonWKT(drawnPolygon);
      console.log('📍 WKT Polygon:', wktPolygon.substring(0, 100) + '...');
      updatePlotMutation.mutate({
        plotId: editingPlot.plotId,
        farmerId: editingPlot.farmerId,
        boundary: wktPolygon,
        area: editingPlot.area,
        status: 0, // Active
        soThua: editingPlot.soThua,
        soTo: editingPlot.soTo,
      });
    }
  };

  const handleTaskFocus = (task: PolygonTask) => {
    // Only set focused state, don't move camera
    // Camera will only move when "Start Drawing" is clicked
    setFocusedTaskId(task.id);
  };

  const handlePlotFocus = (plot: PlotDTO) => {
    console.log('📍 Focusing on plot:', plot.plotId, `(${plot.soThua}/${plot.soTo})`);
    
    // Don't change focus if currently drawing
    if (isDrawing) {
      console.log('⚠️ Cannot focus plot while drawing');
      return;
    }
    
    // Clear search-related states to prevent conflicts
    setShowSearchResults(false);
    setSearchResults([]);
    
    // Clear locked zoom level (unless drawing) to allow free camera movement
    if (!isDrawing) {
      setLockedZoomLevel(null);
    }
    
    // Set focused plot
    setFocusedPlotId(plot.plotId);
    setFocusedTaskId(null); // Clear any focused task
    
    // Get plot coordinates
      const coord = getCoordinatesFromGeoJSON(plot.coordinateGeoJson || '');
      if (coord) {
      console.log('📍 Plot coordinates:', coord);
      
      // Use setTimeout to ensure camera ref is ready
      setTimeout(() => {
        if (cameraRef.current) {
          console.log('📍 Moving camera to plot:', { longitude: coord.longitude, latitude: coord.latitude });
        cameraRef.current.setCamera({
          centerCoordinate: [coord.longitude, coord.latitude],
          zoomLevel: 15,
          animationDuration: 1000,
        });
        } else {
          console.warn('⚠️ Camera ref is null when focusing plot');
      }
      }, 100);
    } else {
      console.warn('⚠️ Could not get coordinates for plot:', plot.plotId);
    }
  };

  const removeLastPoint = () => {
    if (drawnPolygon.length > 0) {
      const newPolygon = drawnPolygon.slice(0, -1);
      setDrawnPolygon(newPolygon);
      if (newPolygon.length >= 3) {
        const area = calculatePolygonArea(newPolygon);
        setPolygonArea(area);
        // Re-validate after removing point
        validatePolygon(newPolygon);
      } else {
        setPolygonArea(0);
        setValidationResult(null);
      }
    }
  };

  const toggleBottomSheet = () => {
    setBottomSheetExpanded(!bottomSheetExpanded);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (result: GeocodeResult) => {
    console.log('🔍 Selecting location:', result.display_name, result.lat, result.lon);
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    
    console.log('🔍 Parsed coordinates:', { latitude, longitude, isValid: !isNaN(latitude) && !isNaN(longitude) });
    
    if (!isNaN(latitude) && !isNaN(longitude)) {
      // Clear any focused plot/task to prevent conflicts
      setFocusedPlotId(null);
      setFocusedTaskId(null);
      setLockedZoomLevel(null);
      
      // Close search results first
      setSearchQuery(result.display_name);
      setShowSearchResults(false);
      setSearchResults([]);
      
      // Use setTimeout to ensure state updates are processed and camera ref is ready
      setTimeout(() => {
        if (cameraRef.current) {
          console.log('🔍 Moving camera to:', { longitude, latitude });
          cameraRef.current.setCamera({
            centerCoordinate: [longitude, latitude],
            zoomLevel: 15,
            animationDuration: 1000,
          });
        } else {
          console.warn('⚠️ Camera ref is null');
        }
      }, 100);
    } else {
      console.error('❌ Invalid coordinates:', { lat: result.lat, lon: result.lon });
      Alert.alert('Lỗi', 'Tọa độ vị trí không hợp lệ');
    }
  };

  const handleSearchFocus = () => {
    if (searchResults.length > 0) {
      setShowSearchResults(true);
    }
  };

  const focusOnCurrentLocation = () => {
    if (!currentLocation || !cameraRef.current) return;

    // Clear locked zoom level to allow free movement
    setLockedZoomLevel(null);

    cameraRef.current.setCamera({
      centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
      zoomLevel: 15,
      animationDuration: 500,
    });
  };

  // Show error if user is not a supervisor
  if (!isSupervisor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <BodySemibold color={colors.error}>Truy cập Bị từ chối</BodySemibold>
          <Spacer size="md" />
          <BodySmall color={colors.textSecondary}>
            Màn hình này chỉ dành cho giám sát viên.
          </BodySmall>
          <Spacer size="lg" />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body color={colors.primary}>Quay lại</Body>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if tasks query failed with 401
  if (tasksError && (tasksError as any)?.response?.status === 401) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <BodySemibold color={colors.error}>Lỗi Xác thực</BodySemibold>
          <Spacer size="md" />
          <BodySmall color={colors.textSecondary}>
            Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.
          </BodySmall>
          <Spacer size="lg" />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body color={colors.primary}>Quay lại</Body>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (plotsLoading || tasksLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Spinner fullScreen />
          <BodySmall color={colors.textSecondary}>Đang tải dữ liệu bản đồ...</BodySmall>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Compact Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Body>←</Body>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <H3 style={styles.headerTitle}>Vẽ Đa giác</H3>
          <BodySmall color={colors.textSecondary}>
            {tasks.length} công việc • {completedPlots.length} đã hoàn thành
          </BodySmall>
        </View>
        <TouchableOpacity
          onPress={toggleBottomSheet}
          style={styles.tasksButton}
        >
          <BodySemibold color={greenTheme.primary}>{tasks.length}</BodySemibold>
        </TouchableOpacity>
      </View>

      {/* Full Screen Map */}
      <View style={styles.mapContainer}>
        {/* Search Location Bar */}
        {!isDrawing && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm vị trí..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                onFocus={handleSearchFocus}
                returnKeyType="search"
                editable={!isDrawing}
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={greenTheme.primary} style={styles.searchLoader} />
              ) : (
                <TouchableOpacity onPress={handleSearch} style={styles.searchButton} disabled={isDrawing}>
                  <Ionicons name="arrow-forward" size={20} color={greenTheme.primary} />
                </TouchableOpacity>
              )}
            </View>
          
          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <Card style={styles.searchResultsCard}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.place_id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSelectLocation(item);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location" size={16} color={greenTheme.primary} />
                    <BodySmall style={styles.searchResultText} numberOfLines={2}>
                      {item.display_name}
                    </BodySmall>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.searchResultSeparator} />}
                keyboardShouldPersistTaps="handled"
              />
            </Card>
          )}
          
          {showSearchResults && searchResults.length === 0 && !isSearching && searchQuery.trim() && (
            <Card style={styles.searchResultsCard}>
              <BodySmall color={colors.textSecondary} style={styles.noResultsText}>
                Không tìm thấy kết quả
              </BodySmall>
            </Card>
          )}
          </View>
        )}

        <PolygonMapbox
          mapRef={mapRef}
          cameraRef={cameraRef}
          initialRegion={initialRegion}
          plots={plots}
          tasks={tasks}
          drawnPolygon={drawnPolygon}
          focusedPlotId={focusedPlotId}
          isDrawing={isDrawing}
          lockedZoomLevel={lockedZoomLevel}
          currentLocation={currentLocation}
          onMapPress={handleMapPress}
          onPlotPress={handlePlotPress}
        />

        {/* Drawing Controls */}
        {isDrawing && (selectedTask || editingPlot) && (
          <DrawingControls
            task={selectedTask}
            editingPlot={editingPlot}
            drawnPolygon={drawnPolygon}
            polygonArea={polygonArea}
            isPending={completeTaskMutation.isPending || updatePlotMutation.isPending}
            isValidating={isValidating}
            validationResult={validationResult}
            onCancel={cancelDrawing}
            onRemoveLastPoint={removeLastPoint}
            onFinish={finishDrawing}
          />
        )}

        {/* Plot Info Tag */}
        {tappedPlot && !isDrawing && (
          <View style={styles.plotTagContainer}>
            <View style={styles.plotTag}>
              <TouchableOpacity
                style={styles.plotTagClose}
                onPress={() => setTappedPlot(null)}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <BodySemibold style={styles.plotTagTitle}>
                {tappedPlot.plot.soThua || tappedPlot.plot.soTo
                  ? `Thửa ${tappedPlot.plot.soThua ?? '-'} / Tờ ${tappedPlot.plot.soTo ?? '-'}`
                  : 'Thửa'}
              </BodySemibold>
              <BodySmall color={colors.textSecondary} style={styles.plotTagInfo}>
                Diện tích: {tappedPlot.plot.area.toFixed(2)} ha
              </BodySmall>
              {tappedPlot.plot.status && (
                <BodySmall color={colors.textSecondary} style={styles.plotTagInfo}>
                  Trạng thái: {tappedPlot.plot.status}
                </BodySmall>
              )}
              {tappedPlot.plot.farmerName && (
                <BodySmall color={colors.textSecondary} style={styles.plotTagInfo}>
                  Nông dân: {tappedPlot.plot.farmerName}
                </BodySmall>
              )}
            </View>
          </View>
        )}

        {/* Current Location Button */}
        {!isDrawing && currentLocation && (
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={focusOnCurrentLocation}
          >
            <Ionicons name="locate" size={24} color={greenTheme.primary} />
          </TouchableOpacity>
        )}

        {/* Floating Action Button */}
        {!isDrawing && (
          <TouchableOpacity
            style={styles.fab}
            onPress={toggleBottomSheet}
          >
            <BodySemibold color={colors.white}>📋</BodySemibold>
            {tasks.length > 0 && (
              <View style={styles.fabBadge}>
                <BodySmall color={colors.white} style={styles.fabBadgeText}>
                  {tasks.length}
                </BodySmall>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Sheet */}
      <TaskBottomSheet
        isExpanded={bottomSheetExpanded}
        activeTab={activeTab}
        tasks={tasks}
        completedPlots={completedPlots}
        focusedTaskId={focusedTaskId}
        selectedTaskId={selectedTask?.id || null}
        editingPlotId={editingPlot?.plotId || null}
        focusedPlotId={focusedPlotId}
        onToggle={toggleBottomSheet}
        onTabChange={setActiveTab}
        onTaskFocus={handleTaskFocus}
        onTaskStartDrawing={startDrawingForTask}
        onPlotFocus={handlePlotFocus}
        onPlotEdit={startEditingPlot}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: greenTheme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: greenTheme.border,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
  },
  tasksButton: {
    padding: spacing.sm,
    minWidth: 40,
    alignItems: 'center',
    backgroundColor: greenTheme.primaryLighter,
    borderRadius: borderRadius.md,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 120,
    right: spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: greenTheme.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: greenTheme.primary,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 999,
  },
  fab: {
    position: 'absolute',
    bottom: 180,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: greenTheme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  fabBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  plotTagContainer: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    zIndex: 1000,
  },
  plotTag: {
    backgroundColor: greenTheme.cardBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 200,
    alignItems: 'center',
    position: 'relative',
  },
  plotTagClose: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    padding: spacing.xs,
    zIndex: 10,
  },
  plotTagTitle: {
    fontSize: 16,
    color: greenTheme.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  plotTagInfo: {
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: greenTheme.cardBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: greenTheme.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  searchButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  searchLoader: {
    marginLeft: spacing.xs,
    padding: spacing.xs,
  },
  searchResultsCard: {
    marginTop: spacing.xs,
    maxHeight: 200,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: greenTheme.border,
    shadowColor: greenTheme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  searchResultText: {
    flex: 1,
    color: colors.textPrimary,
  },
  searchResultSeparator: {
    height: 1,
    backgroundColor: greenTheme.border,
    marginHorizontal: spacing.sm,
  },
  noResultsText: {
    padding: spacing.md,
    textAlign: 'center',
  },
});

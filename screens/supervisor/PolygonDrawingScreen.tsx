/**
 * Polygon Drawing Screen
 * Allow supervisors to draw polygon boundaries for plots
 * Mobile-optimized with full-screen map and bottom sheet
 */

import React, { useState, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MapView, { Region, LatLng } from 'react-native-maps';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing } from '../../theme';
import { H3, Body, BodySmall, BodySemibold, Spinner } from '../../components/ui';
import {
  PolygonMap,
  DrawingControls,
  TaskBottomSheet,
} from '../../components/supervisor';
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

export const PolygonDrawingScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mapRef = useRef<MapView | null>(null);

  const [selectedTask, setSelectedTask] = useState<PolygonTask | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<LatLng[]>([]);
  const [polygonArea, setPolygonArea] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'tasks' | 'completed'>('tasks');
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [focusedPlotId, setFocusedPlotId] = useState<string | null>(null);
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidatePolygonAreaResponse['data'] | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [editingPlot, setEditingPlot] = useState<PlotDTO | null>(null);

  // Queries
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['polygon-tasks'],
    queryFn: getPolygonTasks,
  });

  const { data: plots = [], isLoading: plotsLoading, refetch: refetchPlots } = useQuery({
    queryKey: ['plots', { page: 1, size: 500 }],
    queryFn: getPlots,
  });

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
      
      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      queryClient.invalidateQueries({ queryKey: ['polygon-tasks'] });
      
      // Wait a tiny bit for the backend to propagate changes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refetch the data
      await Promise.all([refetchPlots(), refetchTasks()]);
      
      console.log('🔄 Data refetched after task completion');
      Alert.alert('Success', 'Polygon task completed successfully!');
    },
    onError: (error: any) => {
      console.error('❌ Error completing task:', error);
      Alert.alert('Error', error.message || 'Failed to complete task');
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
      
      // Force immediate cache invalidation and refetch
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      queryClient.invalidateQueries({ queryKey: ['polygon-tasks'] });
      
      // Wait a tiny bit for the backend to propagate changes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refetch the data
      await Promise.all([refetchPlots(), refetchTasks()]);
      
      console.log('🔄 Data refetched after update');
      Alert.alert('Success', 'Plot boundary updated successfully!');
    },
    onError: (error: any) => {
      console.error('❌ Error updating plot:', error);
      Alert.alert('Error', error.message || 'Failed to update plot');
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

  const initialRegion: Region = plotCenters.length > 0
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

  const handleMapPress = (event: any) => {
    // Allow drawing for both task AND editing modes
    if (!isDrawing || (!selectedTask && !editingPlot)) {
      console.log('⚠️ Map press ignored:', { isDrawing, hasTask: !!selectedTask, hasEditingPlot: !!editingPlot });
      return;
    }

    console.log('📍 Map pressed, adding point');
    const { coordinate } = event.nativeEvent;
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

  const validatePolygon = async (polygon: LatLng[]) => {
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
    if (plot && mapRef.current) {
      const coord = getCoordinatesFromGeoJSON(plot.coordinateGeoJson || '');
      if (coord) {
        mapRef.current.animateToRegion(
          {
            ...coord,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000,
        );
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

    if (mapRef.current) {
      const coord = getCoordinatesFromGeoJSON(plot.coordinateGeoJson || '');
      if (coord) {
        mapRef.current.animateToRegion(
          {
            ...coord,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000,
        );
      }
    }
  };

  const cancelDrawing = () => {
    setSelectedTask(null);
    setEditingPlot(null);
    setIsDrawing(false);
    setDrawnPolygon([]);
    setPolygonArea(0);
    setValidationResult(null);
    setIsValidating(false);
    setBottomSheetExpanded(true);
  };

  const finishDrawing = () => {
    console.log('💾 Attempting to save polygon...');
    
    if (drawnPolygon.length < 3) {
      Alert.alert('Error', 'Polygon must have at least 3 points');
      return;
    }

    // Check validation result
    if (!validationResult) {
      Alert.alert('Validation Required', 'Please wait for polygon validation to complete');
      return;
    }

    // STRICT: Validation must pass to save
    if (!validationResult.isValid) {
      console.log('❌ Validation failed, cannot save');
      Alert.alert(
        'Validation Failed',
        `${validationResult.message}\n\nDrawn Area: ${validationResult.drawnAreaHa} ha\nPlot Area: ${validationResult.plotAreaHa} ha\nDifference: ${validationResult.differencePercent.toFixed(1)}%\nMax Allowed: ${validationResult.tolerancePercent}%\n\nPlease redraw the polygon with correct area.`,
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
    setFocusedTaskId(task.id);
    const plot = plots.find((p) => p.plotId === task.plotId);
    if (plot && mapRef.current) {
      const coord = getCoordinatesFromGeoJSON(plot.coordinateGeoJson || '');
      if (coord) {
        mapRef.current.animateToRegion(
          {
            ...coord,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000,
        );
      }
    }
  };

  const handlePlotFocus = (plot: PlotDTO) => {
    setFocusedPlotId(plot.plotId);
    if (mapRef.current) {
      const coord = getCoordinatesFromGeoJSON(plot.coordinateGeoJson || '');
      if (coord) {
        mapRef.current.animateToRegion(
          {
            ...coord,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000,
        );
      }
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

  if (plotsLoading || tasksLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Spinner fullScreen />
          <BodySmall color={colors.textSecondary}>Loading map data...</BodySmall>
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
          <H3 style={styles.headerTitle}>Polygon Drawing</H3>
          <BodySmall color={colors.textSecondary}>
            {tasks.length} tasks • {completedPlots.length} completed
          </BodySmall>
        </View>
        <TouchableOpacity
          onPress={toggleBottomSheet}
          style={styles.tasksButton}
        >
          <BodySemibold color={colors.primary}>{tasks.length}</BodySemibold>
        </TouchableOpacity>
      </View>

      {/* Full Screen Map */}
      <View style={styles.mapContainer}>
        <PolygonMap
          mapRef={mapRef}
          initialRegion={initialRegion}
          plots={plots}
          tasks={tasks}
          drawnPolygon={drawnPolygon}
          focusedPlotId={focusedPlotId}
          onMapPress={handleMapPress}
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    bottom: 120,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
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
});

module.exports = {
  expo: {
    name: "MyApp",
    slug: "MyApp",
    version: "1.0.0",
    scheme: "myapp",
    orientation: "portrait",
    icon: "./assets/icons/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/icons/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.myapp",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app needs access to your location to show your position on the map.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs background location access to provide navigation and alerts even when the screen is locked.",
        NSLocationAlwaysUsageDescription: "This app requires background location to track your route.",
        NSLocalNetworkUsageDescription: "This app needs access to the local network to communicate with the Metro development server on your Mac."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icons/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.myapp",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      favicon: "./assets/icons/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow MyApp to use your location even when the app is in the background."
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "buildToolsVersion": "35.0.0",
            "newArchEnabled": true
          }
        }
      ],
      [
        "@rnmapbox/maps",
        {
          "RNMapboxMapsImpl": "mapbox",
          "MAPBOX_DOWNLOADS_TOKEN": "sk.eyJ1IjoiZHVjbmd1eWVuMTIwNDA0IiwiYSI6ImNtamF4d2RmOTA1ajczY3F4dHNqbXhkOGwifQ.1ytcAiJBgUe-d2MNShpoZw"
        }
      ]
    ],
    extra: {
      apiUrl: "https://4bldd7d2-5100.asse.devtunnels.ms/api",
      router: {},
      eas: {
        projectId: "5cce9704-e29b-495f-b7a4-e39106109240"
      },
      mapboxAccessToken: "pk.eyJ1IjoiZHVjbmd1eWVuMTIwNDA0IiwiYSI6ImNtamF4b3RuNDA3N3gzZnF4Z2RiZGNudGgifQ.frZ1ll3lizDPgi9DPb4kEw"
    }
  }
};
module.exports = {
  expo: {
    name: "Duc Thanh Coop",
    slug: "MyApp",
    version: "1.0.0",
    scheme: "duc-thanh-coop",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ducthanhcoop",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app needs access to your location to show your position on the map.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs background location access to provide navigation and alerts even when the screen is locked.",
        NSLocationAlwaysUsageDescription: "This app requires background location to track your route.",
        NSLocalNetworkUsageDescription: "This app needs access to the local network to communicate with the Metro development server on your Mac."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#ffffff"
      },
      package: "com.ducthanhcoop",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      favicon: "./assets/logo.png",
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
      // apiUrl: "https://riceproduction-hef0e2b3gbc5akay.southeastasia-01.azurewebsites.net/api",
      apiUrl: "http://157.66.218.227:5000/api",
      router: {},
      eas: {
        projectId: "5cce9704-e29b-495f-b7a4-e39106109240"
      },
      mapboxAccessToken: "pk.eyJ1IjoiZHVjbmd1eWVuMTIwNDA0IiwiYSI6ImNtamF4b3RuNDA3N3gzZnF4Z2RiZGNudGgifQ.frZ1ll3lizDPgi9DPb4kEw"
    }
  }
};
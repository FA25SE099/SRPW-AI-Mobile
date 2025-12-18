module.exports = {
  expo: {
    name: "MyApp",
    slug: "MyApp",
    version: "1.0.0",
    scheme: "myapp",
    orientation: "portrait",
    icon: "./assets/icons/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/icons/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.myapp"
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
      "expo-router"
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

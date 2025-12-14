export default {
  expo: {
    name: "Agrovet POS - Agrisols Systems",
    slug: "agrovet-pos",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "agrovetpos",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#2E7D32"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.agrovetpos.app"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#2E7D32",
        foregroundImage: "./assets/images/icon.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.agrovetpos.app",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#2E7D32",
          dark: {
            backgroundColor: "#1B5E20"
          }
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos to upload receipts"
        }
      ],
      "expo-web-browser"
    ],
    experiments: {
      reactCompiler: true
    },
    extra: {
      eas: {
        projectId: "4978aa1b-9880-4fb1-ad30-c1257e9e782f"
      },
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      openaiApiKey: process.env.OPEN_AI_KEY
    }
  }
};
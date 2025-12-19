import Expo
import React
import ReactAppDependencyProvider

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // First try to use the bundle URL from the bridge (set by deep link)
    if let bundleURL = bridge.bundleURL {
      return bundleURL
    }
    
    // Fallback to bundleURL() which will try to get Metro URL
    return bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    // Try to get Metro URL from RCTBundleURLProvider
    if let metroURL = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry") {
      return metroURL
    }
    
    // Fallback: Try to construct a default Metro URL
    // This helps when app launches without deep link
    let bundleRoot = ".expo/.virtual-metro-entry"
    let localhost = "localhost"
    let port = 8081
    
    // Try localhost first
    if let url = URL(string: "http://\(localhost):\(port)/\(bundleRoot).bundle?platform=ios&dev=true&minify=false") {
      return url
    }
    
    // If that fails, return nil (will show error screen)
    return nil
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

export const MOBILE_ROUTE_LOADING_EVENT = "timely:mobile-route-loading-start";

/**
 * Emits a mobile route-loading event used to show a short transition overlay.
 */
export const emitMobileRouteLoadingStart = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MOBILE_ROUTE_LOADING_EVENT));
  }
};

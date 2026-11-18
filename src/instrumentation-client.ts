if (process.env.NODE_ENV === "development") {
  const nativeMeasure = Performance.prototype.measure;

  Performance.prototype.measure = function (...args: Parameters<Performance["measure"]>) {
    try {
      return Reflect.apply(nativeMeasure, this, args);
    } catch (error) {
      if (error instanceof TypeError && /negative time stamp|end cannot be negative|invalid timestamp/i.test(error.message)) {
        return undefined as unknown as PerformanceMeasure;
      }
      throw error;
    }
  };
}

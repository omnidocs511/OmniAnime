/**
 * Loading skeleton components — responsive across all breakpoints.
 */

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[280px] xs:h-[340px] sm:h-[420px] md:h-[460px] lg:h-[500px] bg-bg-secondary">
      <div className="absolute inset-0 skeleton" />
      <div className="absolute bottom-8 sm:bottom-12 left-4 sm:left-8 md:left-12 lg:left-16 space-y-2 sm:space-y-3">
        <div className="skeleton h-6 sm:h-8 w-48 sm:w-80 rounded" />
        <div className="skeleton h-3 sm:h-4 w-36 sm:w-60 rounded" />
        <div className="skeleton h-10 sm:h-16 w-64 sm:w-96 rounded hidden sm:block" />
        <div className="skeleton h-8 sm:h-10 w-28 sm:w-36 rounded-lg" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="animate-fade-in-up pt-14">
      {/* Banner skeleton */}
      <div className="skeleton w-full h-[200px] xs:h-[240px] sm:h-[300px] md:h-[350px] lg:h-[380px]" />

      <div className="px-4 sm:px-8 md:px-12 lg:px-16 -mt-28 sm:-mt-40 md:-mt-48 relative z-10">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Poster */}
          <div className="skeleton w-[140px] xs:w-[160px] sm:w-[190px] md:w-[210px] lg:w-[230px] aspect-2/3 rounded-lg shrink-0 mx-auto sm:mx-0" />

          {/* Info */}
          <div className="flex-1 space-y-2 sm:space-y-3 pt-1 sm:pt-4 md:pt-8">
            <div className="skeleton h-6 sm:h-8 w-3/4 rounded" />
            <div className="skeleton h-4 sm:h-5 w-1/2 rounded" />
            <div className="skeleton h-3 sm:h-4 w-full rounded" />
            <div className="skeleton h-3 sm:h-4 w-full rounded" />
            <div className="skeleton h-3 sm:h-4 w-2/3 rounded" />
            <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              <div className="skeleton h-6 sm:h-8 w-16 sm:w-20 rounded" />
              <div className="skeleton h-6 sm:h-8 w-16 sm:w-20 rounded" />
              <div className="skeleton h-6 sm:h-8 w-16 sm:w-20 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="w-[130px] xs:w-[140px] sm:w-[155px] md:w-[165px] lg:w-[175px] shrink-0">
      <div className="skeleton aspect-2/3 rounded-lg" />
      <div className="skeleton h-3 sm:h-4 w-3/4 mt-1.5 sm:mt-2 rounded" />
      <div className="skeleton h-2.5 sm:h-3 w-1/2 mt-1 rounded" />
    </div>
  );
}

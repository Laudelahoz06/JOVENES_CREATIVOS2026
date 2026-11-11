function Skeleton({ width = "100%", height = 16, radius = 8, className = "" }) {
    return (
        <span
            className={`skeleton ${className}`.trim()}
            style={{ width, height, borderRadius: radius }}
            aria-hidden="true"
        />
    );
}

export function ProductCardSkeleton() {
    return (
        <article className="catalog-product-card skeleton-card">
            <Skeleton height={230} radius={0} />

            <div className="catalog-product-info skeleton-card-body">
                <Skeleton width="40%" height={12} />
                <Skeleton width="80%" height={20} />
                <Skeleton width="50%" height={16} />
                <Skeleton width="100%" height={38} radius={8} />
            </div>
        </article>
    );
}

export function LineSkeleton({ lines = 3 }) {
    return (
        <div className="skeleton-lines">
            {Array.from({ length: lines }, (_, index) => (
                <Skeleton
                    key={index}
                    width={index === lines - 1 ? "60%" : "100%"}
                    height={14}
                />
            ))}
        </div>
    );
}

export default Skeleton;

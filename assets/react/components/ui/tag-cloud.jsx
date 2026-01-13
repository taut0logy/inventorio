import React, { useMemo } from 'react';
import { motion } from 'motion/react';

/**
 * Animated Tag Cloud Component
 * Tags are sized based on their count/weight
 * Uses smooth animations and hover effects
 */
export function TagCloud({ tags = [], className = '' }) {
    // Calculate font sizes based on tag counts
    const processedTags = useMemo(() => {
        if (tags.length === 0) return [];
        
        const counts = tags.map(t => t.count || 1);
        const maxCount = Math.max(...counts);
        const minCount = Math.min(...counts);
        const range = maxCount - minCount || 1;

        // Color palette for variety
        const colors = [
            'text-blue-500 hover:text-blue-600 dark:text-blue-400',
            'text-purple-500 hover:text-purple-600 dark:text-purple-400',
            'text-pink-500 hover:text-pink-600 dark:text-pink-400',
            'text-indigo-500 hover:text-indigo-600 dark:text-indigo-400',
            'text-cyan-500 hover:text-cyan-600 dark:text-cyan-400',
            'text-teal-500 hover:text-teal-600 dark:text-teal-400',
            'text-emerald-500 hover:text-emerald-600 dark:text-emerald-400',
            'text-orange-500 hover:text-orange-600 dark:text-orange-400',
        ];

        return tags.map((tag, index) => {
            const count = tag.count || 1;
            // Map count to font size (0.75rem to 1.75rem)
            const normalized = (count - minCount) / range;
            const fontSize = 0.75 + normalized * 1;
            // Map count to font weight
            const fontWeight = normalized > 0.5 ? 600 : 400;
            // Assign color based on index
            const colorClass = colors[index % colors.length];
            
            // Random scatter effects
            const rotation = Math.random() * 12 - 6; // -6 to +6 degrees
            const verticalOffset = Math.random() * 16 - 8; // -8px to +8px

            return {
                ...tag,
                fontSize,
                fontWeight,
                colorClass,
                rotation,
                verticalOffset,
                delay: index * 0.03,
            };
        });
    }, [tags]);

    if (tags.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-wrap gap-x-6 gap-y-4 justify-center items-center px-8 py-4 ${className}`}>
            {processedTags.map((tag, idx) => (
                <motion.a
                    key={tag.id || tag.name}
                    href={`/search?tag=${encodeURIComponent(tag.name)}`}
                    className={`${tag.colorClass} transition-colors duration-300 whitespace-nowrap`}
                    style={{
                        fontSize: `${tag.fontSize}rem`,
                        fontWeight: tag.fontWeight,
                        display: 'inline-block',
                    }}
                    initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1,
                        rotate: tag.rotation,
                        y: tag.verticalOffset
                    }}
                    transition={{ 
                        duration: 0.5, 
                        delay: tag.delay,
                        type: "spring",
                        stiffness: 100
                    }}
                    whileHover={{ 
                        scale: 1.2,
                        rotate: 0,
                        y: 0,
                        zIndex: 10,
                        transition: { duration: 0.2 }
                    }}
                >
                    #{tag.name}
                </motion.a>
            ))}
        </div>
    );
}

/**
 * 3D-style rotating tag cloud (Sphere)
 * Auto-rotates and responds to mouse interaction
 */
export function TagCloudSphere({ tags = [], size = 300 }) {
    const containerRef = React.useRef(null);
    const [rotation, setRotation] = React.useState({ x: 0, y: 0 });
    const requestRef = React.useRef();
    const [isHovering, setIsHovering] = React.useState(false);

    // Initial positions on a sphere (Fibonacci lattice)
    const initialPositions = useMemo(() => {
        if (tags.length === 0) return [];
        
        const counts = tags.map(t => t.count || 1);
        const maxCount = Math.max(...counts);
        const minCount = Math.min(...counts);
        const range = maxCount - minCount || 1;

        return tags.map((tag, index) => {
            const phi = Math.acos(-1 + (2 * index + 1) / tags.length);
            const theta = Math.sqrt(tags.length * Math.PI) * phi;
            
            return {
                ...tag,
                x: Math.cos(theta) * Math.sin(phi),
                y: Math.sin(theta) * Math.sin(phi),
                z: Math.cos(phi),
                fontSize: 0.8 + ((tag.count || 1) - minCount) / range * 0.6, // 0.8 to 1.4rem
                colorClass: 'text-primary'
            };
        });
    }, [tags]);

    // Animation loop
    React.useEffect(() => {
        let angleX = 0;
        let angleY = 0;
        const speed = 0.002;

        const animate = () => {
            if (!isHovering) {
                // Auto rotate
                angleY += speed;
                setRotation(prev => ({ 
                    x: prev.x * 0.98, // Decay mouse influence
                    y: prev.y + speed 
                }));
            }
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isHovering]);

    // Handle mouse move for interactive rotation
    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        // Map mouse position to rotation speed/direction
        setRotation({
            x: -y * 0.0005,
            y: x * 0.0005
        });
    };

    if (tags.length === 0) return null;

    // Calculate current projected positions based on rotation
    const projectedTags = initialPositions.map(tag => {
        // Rotate around X
        let y1 = tag.y * Math.cos(rotation.x) - tag.z * Math.sin(rotation.x);
        let z1 = tag.z * Math.cos(rotation.x) + tag.y * Math.sin(rotation.x);

        // Rotate around Y
        let x2 = tag.x * Math.cos(rotation.y) - z1 * Math.sin(rotation.y);
        let z2 = z1 * Math.cos(rotation.y) + tag.x * Math.sin(rotation.y);

        // Perspective transform
        const scale = 300 / (300 - z2 * (size/2)); // perspective factor
        const alpha = (z2 + 1) / 2; // opacity based on depth

        return {
            ...tag,
            x2: x2 * (size/2.2), // Scale to container
            y2: y1 * (size/2.2),
            scale: Math.max(0.5, scale),
            opacity: Math.max(0.2, Math.min(1, alpha + 0.3)), // Ensure visibility
            zIndex: Math.round(z2 * 100)
        };
    });

    return (
        <div 
            ref={containerRef}
            className="relative mx-auto touch-none cursor-pointer"
            style={{ width: size, height: size }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={handleMouseMove}
        >
            {projectedTags.map((tag, idx) => (
                <a
                    key={tag.id || tag.name}
                    href={`/search?q=${encodeURIComponent(tag.name)}`}
                    className="absolute left-1/2 top-1/2 whitespace-nowrap font-medium hover:text-blue-500 transition-colors duration-200"
                    style={{
                        transform: `translate3d(calc(-50% + ${tag.x2}px), calc(-50% + ${tag.y2}px), 0) scale(${tag.scale})`,
                        opacity: tag.opacity,
                        zIndex: tag.zIndex,
                        fontSize: `${tag.fontSize}rem`,
                        color: `hsl(var(--primary) / ${tag.opacity})` // Fade color with depth
                    }}
                >
                    {tag.name}
                </a>
            ))}
        </div>
    );
}

export default TagCloudSphere;

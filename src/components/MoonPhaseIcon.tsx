// Moon Phase Icon Component
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface MoonPhaseIconProps {
  phaseValue: number; // 0 = New Moon, 0.5 = Full Moon, 1 = New Moon again
  size?: number;
}

export const MoonPhaseIcon: React.FC<MoonPhaseIconProps> = ({
  phaseValue,
  size = 60,
}) => {
  const radius = size / 2 - 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Calculate the illuminated portion based on phase
  const getPath = () => {
    const phase = phaseValue % 1;

    if (phase === 0) {
      // New Moon - completely dark
      return null;
    }

    if (phase === 0.5) {
      // Full Moon - completely lit
      return (
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="#FFF9E6"
        />
      );
    }

    // Calculate the curve for partial phases
    const illumination = Math.abs(phase <= 0.5 ? phase * 2 : (1 - phase) * 2);
    const curveOffset = radius * (1 - illumination * 2);

    if (phase < 0.5) {
      // Waxing - lit from right
      return (
        <Path
          d={`
            M ${centerX} ${centerY - radius}
            A ${radius} ${radius} 0 1 1 ${centerX} ${centerY + radius}
            A ${Math.abs(curveOffset)} ${radius} 0 0 ${curveOffset > 0 ? 0 : 1} ${centerX} ${centerY - radius}
          `}
          fill="#FFF9E6"
        />
      );
    } else {
      // Waning - lit from left
      return (
        <Path
          d={`
            M ${centerX} ${centerY - radius}
            A ${radius} ${radius} 0 1 0 ${centerX} ${centerY + radius}
            A ${Math.abs(curveOffset)} ${radius} 0 0 ${curveOffset > 0 ? 1 : 0} ${centerX} ${centerY - radius}
          `}
          fill="#FFF9E6"
        />
      );
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle (dark side) */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="#2A2A3A"
          stroke="#FFF9E6"
          strokeWidth={1}
          strokeOpacity={0.3}
        />
        {/* Illuminated portion */}
        {getPath()}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { StyleSheet, View } from 'react-native';

import type { ProductForm } from '../data/medicines';

type Props = {
  pieces: number;
  form: ProductForm;
  color: string;
  emptyColor: string;
};

/** Znázorní počet tablet (dělených na čtvrtiny) nebo čípků (dělených na poloviny). */
export function PieceVisual({ pieces, form, color, emptyColor }: Props) {
  const whole = Math.floor(pieces);
  const fraction = pieces % 1;
  const fills = [...Array<number>(whole).fill(1), ...(fraction > 0 ? [fraction] : [])];

  return (
    <View style={styles.row} accessible={false} importantForAccessibility="no-hide-descendants">
      {fills.map((fill, index) =>
        form === 'tablet' ? (
          <Tablet key={index} fill={fill} color={color} emptyColor={emptyColor} />
        ) : (
          <Suppository key={index} fill={fill} color={color} emptyColor={emptyColor} />
        ),
      )}
    </View>
  );
}

type ShapeProps = { fill: number; color: string; emptyColor: string };

function Tablet({ fill, color, emptyColor }: ShapeProps) {
  const quarters = Math.round(fill * 4);
  return (
    <View style={[styles.tablet, { borderColor: color, backgroundColor: emptyColor }]}>
      {[0, 1, 2, 3].map((quarter) => (
        <View
          key={quarter}
          style={[
            styles.quarter,
            { borderColor: emptyColor, backgroundColor: quarter < quarters ? color : emptyColor },
          ]}
        />
      ))}
    </View>
  );
}

function Suppository({ fill, color, emptyColor }: ShapeProps) {
  return (
    <View style={[styles.suppository, { borderColor: color, backgroundColor: emptyColor }]}>
      <View style={{ flex: 1, backgroundColor: color }} />
      <View style={{ flex: 1, backgroundColor: fill >= 1 ? color : emptyColor }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tablet: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quarter: {
    width: '50%',
    height: '50%',
    borderWidth: StyleSheet.hairlineWidth,
  },
  suppository: {
    width: 20,
    height: 40,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderWidth: 2,
    overflow: 'hidden',
  },
});

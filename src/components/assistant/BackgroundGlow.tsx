import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { icons } from "../../assets/icons";

// Geometry copied from Figma node 288:16327: a 627.49 × 885.815 box rotated 65.37°,
// its image bleeding past the box by the insets below (top/right/bottom/left in % of box).
const BOX_W = 627.49;
const BOX_H = 885.815;
const INSET = { top: 0.2391, right: 0.3374, bottom: 0.1796, left: 0.2533 };

export function BackgroundGlow() {
  return (
    <View pointerEvents="none" style={styles.outer}>
      <View style={styles.box}>
        <Image
          source={icons.bgVector}
          contentFit="fill"
          style={{
            position: "absolute",
            left: -INSET.left * BOX_W,
            top: -INSET.top * BOX_H,
            width: BOX_W * (1 + INSET.left + INSET.right),
            height: BOX_H * (1 + INSET.top + INSET.bottom),
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: -250.36,
    top: 241.29,
    width: 1066.725,
    height: 939.55,
    alignItems: "center",
    justifyContent: "center",
  },
  box: { width: BOX_W, height: BOX_H, transform: [{ rotate: "65.37deg" }] },
});

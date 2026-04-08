import { gameWebSocketActions } from "./websocket";
import { gameNavigationActions } from "./navigation";
import { gameBoardActions } from "./board";
import { gameAnalysisActions } from "./analysis";
import { gameHelperActions } from "./helpers";
import { gamePvActions } from "./pv";
import { gameInitActions } from "./init";

export const gameActions = {
  ...gameWebSocketActions,
  ...gameNavigationActions,
  ...gameBoardActions,
  ...gameAnalysisActions,
  ...gameHelperActions,
  ...gameInitActions,
  ...gamePvActions,
} as const;

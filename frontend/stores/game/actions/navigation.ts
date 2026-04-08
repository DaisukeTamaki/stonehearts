import type { GameStoreThis } from "../types";
import { navigationService } from "~/services/navigationService";

interface NavigateOptions {
  triggerAnalysis?: boolean;
  updateUrl?: boolean;
}

export const gameNavigationActions = {
  navigate(this: GameStoreThis, action: () => void, options: NavigateOptions = {}): void {
    action();
    if (options.updateUrl && this.gameId) this.updateUrlWithMoveNumber();
    if (options.triggerAnalysis !== false && !this.isPvMode) this.analyzeCurrentMove();
  },

  navigateStep(this: GameStoreThis, step: number, options: NavigateOptions = {}): void {
    this.navigate(() => {
      const target = navigationService.calculateTargetIndex(this.currentMoveIndex, step, this.gameHistory.length);
      if (target !== this.currentMoveIndex) this.currentMoveIndex = target;
    }, options);
  },

  navigateToMove(this: GameStoreThis, moveIndex: number, options: NavigateOptions = {}): void {
    this.navigate(() => {
      if (navigationService.isValidIndex(moveIndex, this.gameHistory.length) && moveIndex !== this.currentMoveIndex) {
        this.currentMoveIndex = moveIndex;
      }
    }, options);
  },

  navigateToStart(this: GameStoreThis): void {
    this.navigate(() => { if (this.currentMoveIndex !== 0) this.currentMoveIndex = 0; });
  },

  navigateToEnd(this: GameStoreThis): void {
    this.navigate(() => {
      const last = this.gameHistory.length - 1;
      if (this.currentMoveIndex !== last) this.currentMoveIndex = last;
    });
  },

  navigateForward10(this: GameStoreThis): void {
    const { forward10 } = navigationService.calculateJumpTargets(this.currentMoveIndex, this.gameHistory.length);
    this.navigateToMove(forward10);
  },

  navigateBackward10(this: GameStoreThis): void {
    const { backward10 } = navigationService.calculateJumpTargets(this.currentMoveIndex, this.gameHistory.length);
    this.navigateToMove(backward10);
  },

  navigateByKeyboard(this: GameStoreThis, event: KeyboardEvent): void {
    const c = navigationService.getNavigationConstraints(this.currentMoveIndex, this.gameHistory.length);
    const opts = { updateUrl: true };
    switch (event.key) {
      case "ArrowLeft": if (c.canMoveBackward) { event.shiftKey ? this.navigateBackward10() : this.navigateStep(-1, opts); } break;
      case "ArrowRight": if (c.canMoveForward) { event.shiftKey ? this.navigateForward10() : this.navigateStep(1, opts); } break;
      case "Home": if (c.canMoveToStart) this.navigateToStart(); break;
      case "End": if (c.canMoveToEnd) this.navigateToEnd(); break;
    }
  },

  updateUrlWithMoveNumber(this: GameStoreThis): void {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("move", this.currentMoveIndex.toString());
    window.history.replaceState({}, "", url.toString());
  },

  initializeFromUrl(this: GameStoreThis): void {
    if (typeof window === "undefined") return;
    const moveParam = new URL(window.location.href).searchParams.get("move");
    if (moveParam) {
      const idx = parseInt(moveParam, 10);
      if (navigationService.isValidIndex(idx, this.gameHistory.length)) {
        this.navigateToMove(idx, { triggerAnalysis: false });
      }
    }
  },
} as const;

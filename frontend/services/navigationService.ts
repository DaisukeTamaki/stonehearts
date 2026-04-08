class NavigationService {
  private static instance: NavigationService;
  static getInstance(): NavigationService {
    if (!NavigationService.instance) NavigationService.instance = new NavigationService();
    return NavigationService.instance;
  }

  calculateTargetIndex(current: number, step: number, historyLength: number): number {
    return Math.max(0, Math.min(current + step, historyLength - 1));
  }

  calculateJumpTargets(current: number, historyLength: number) {
    return {
      forward10: Math.min(current + 10, historyLength - 1),
      backward10: Math.max(current - 10, 0),
      start: 0,
      end: historyLength - 1,
    };
  }

  isValidIndex(index: number, historyLength: number): boolean {
    return index >= 0 && index < historyLength;
  }

  getNavigationConstraints(current: number, historyLength: number) {
    return {
      canMoveForward: current < historyLength - 1,
      canMoveBackward: current > 0,
      canMoveForward10: current + 10 < historyLength,
      canMoveBackward10: current >= 10,
      canMoveToStart: current > 0,
      canMoveToEnd: current < historyLength - 1,
    };
  }
}

export const navigationService = NavigationService.getInstance();

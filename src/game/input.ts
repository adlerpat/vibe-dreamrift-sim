export class InputController {
  private readonly pressedKeys = new Set<string>();
  private tabPressed = false;
  private readonly abilityPressed: Record<"melee" | "ranged" | "role", boolean> = {
    melee: false,
    ranged: false,
    role: false,
  };

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  attach(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  detach(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.pressedKeys.clear();
    this.tabPressed = false;
    this.abilityPressed.melee = false;
    this.abilityPressed.ranged = false;
    this.abilityPressed.role = false;
  }

  getMovementVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.pressedKeys.has("a") || this.pressedKeys.has("arrowleft")) {
      x -= 1;
    }

    if (this.pressedKeys.has("d") || this.pressedKeys.has("arrowright")) {
      x += 1;
    }

    if (this.pressedKeys.has("w") || this.pressedKeys.has("arrowup")) {
      y -= 1;
    }

    if (this.pressedKeys.has("s") || this.pressedKeys.has("arrowdown")) {
      y += 1;
    }

    return { x, y };
  }

  consumeTabPress(): boolean {
    if (!this.tabPressed) {
      return false;
    }

    this.tabPressed = false;
    return true;
  }

  consumeAbilityPress(abilityId: "melee" | "ranged" | "role"): boolean {
    if (!this.abilityPressed[abilityId]) {
      return false;
    }

    this.abilityPressed[abilityId] = false;
    return true;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Tab") {
      event.preventDefault();
      this.tabPressed = true;
    }

    if (event.key === "1") {
      this.abilityPressed.melee = true;
    }

    if (event.key === "2") {
      this.abilityPressed.ranged = true;
    }

    if (event.key === "3") {
      this.abilityPressed.role = true;
    }

    this.pressedKeys.add(event.key.toLowerCase());
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key.toLowerCase());
  }
}

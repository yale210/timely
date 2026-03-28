import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalise,
  getRandomPresetColour,
  fitFloatingPosition,
  getDropdownLayout,
  getMenuPosition,
  getPickerPosition,
  parseColourInput,
} from '../../../src/components/categories/CategoryMultiSelect.utils';

describe('CategoryMultiSelect.utils', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    // Mock window inner dimensions
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
  });

  describe('normalise', () => {
    it('trims and lowercases the input', () => {
      expect(normalise('  TesT  ')).toBe('test');
    });
  });

  describe('getRandomPresetColour', () => {
    it('returns a color from the preset list', () => {
      const presets = ['#111111', '#222222', '#333333'];
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(getRandomPresetColour(presets)).toBe('#111111');
      
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      expect(getRandomPresetColour(presets)).toBe('#333333');
    });
  });

  describe('fitFloatingPosition', () => {
    const padding = 8;
    it('clamps to the right edge', () => {
      const position = { left: 1000, top: 100 };
      const rect = { left: 1000, right: 1100, top: 100, bottom: 200, width: 100, height: 100 } as DOMRect;
      const result = fitFloatingPosition(position, rect, padding);
      expect(result.left).toBe(1024 - 100 - padding);
      expect(result.top).toBe(100);
    });

    it('clamps to the left edge', () => {
      const position = { left: -50, top: 100 };
      const rect = { left: -50, right: 50, top: 100, bottom: 200, width: 100, height: 100 } as DOMRect;
      const result = fitFloatingPosition(position, rect, padding);
      expect(result.left).toBe(padding);
      expect(result.top).toBe(100);
    });

    it('clamps to the bottom edge', () => {
      const position = { left: 100, top: 700 };
      const rect = { left: 100, right: 200, top: 700, bottom: 800, width: 100, height: 100 } as DOMRect;
      const result = fitFloatingPosition(position, rect, padding);
      expect(result.left).toBe(100);
      expect(result.top).toBe(768 - 100 - padding);
    });

    it('clamps to the top edge', () => {
      const position = { left: 100, top: -50 };
      const rect = { left: 100, right: 200, top: -50, bottom: 50, width: 100, height: 100 } as DOMRect;
      const result = fitFloatingPosition(position, rect, padding);
      expect(result.left).toBe(100);
      expect(result.top).toBe(padding);
    });
  });

  describe('getDropdownLayout', () => {
    it('returns null if input is null', () => {
      expect(getDropdownLayout(null)).toBeNull();
    });

    it('calculates layout placing dropdown below', () => {
      const input = document.createElement('input');
      input.getBoundingClientRect = () => ({
        left: 100,
        right: 300,
        top: 100,
        bottom: 140,
        width: 200,
        height: 40,
        x: 100,
        y: 100,
        toJSON: () => ({})
      });

      const result = getDropdownLayout(input);
      expect(result).not.toBeNull();
      expect(result?.position.top).toBe(140 + 6); // rect.bottom + DROPDOWN_OFFSET
      expect(result?.position.left).toBe(100);
      expect(result?.position.width).toBe(200);
      expect(result?.maxHeight).toBe(224); // DROPDOWN_PREFERRED_HEIGHT
    });

    it('calculates layout placing dropdown above if not enough space below', () => {
      const input = document.createElement('input');
      input.getBoundingClientRect = () => ({
        left: 100,
        right: 300,
        top: 600,
        bottom: 640,
        width: 200,
        height: 40,
        x: 100,
        y: 600,
        toJSON: () => ({})
      });

      const result = getDropdownLayout(input);
      expect(result).not.toBeNull();
      // maxHeight = min(224, spaceAbove: 600 - 8 = 592) => 224
      // top = rect.top (600) - maxHeight (224) - DROPDOWN_OFFSET (6) = 370
      expect(result?.position.top).toBe(370);
      expect(result?.maxHeight).toBe(224);
    });
  });

  describe('getMenuPosition', () => {
    it('calculates menu position based on button rect', () => {
      const button = document.createElement('button');
      button.getBoundingClientRect = () => ({
        left: 500,
        right: 550,
        top: 100,
        bottom: 140,
        width: 50,
        height: 40,
        x: 500,
        y: 100,
        toJSON: () => ({})
      });

      const result = getMenuPosition(button);
      expect(result.left).toBe(550 - 176); // rect.right - MENU_WIDTH
      expect(result.top).toBe(140 + 6); // rect.bottom + DROPDOWN_OFFSET
    });
  });

  describe('getPickerPosition', () => {
    it('calculates picker position based on trigger rect', () => {
      const rect = { left: 400, top: 400 } as DOMRect;
      const result = getPickerPosition(rect);
      expect(result.left).toBe(120); // 400 - 280
      expect(result.top).toBe(120); // 400 - 280
    });
  });

  describe('parseColourInput', () => {
    it('parses valid hex', () => {
      expect(parseColourInput('#AABBCC')).toBe('#aabbcc');
      expect(parseColourInput('  #AAbbcC  ')).toBe('#aabbcc');
    });

    it('returns null for invalid hex', () => {
      expect(parseColourInput('#AABB')).toBeNull();
      expect(parseColourInput('AABBCC')).toBeNull();
    });

    it('parses rgb', () => {
      expect(parseColourInput('rgb(255, 0, 128)')).toBe('#ff0080');
      expect(parseColourInput(' rgb( 0 , 255 , 255 ) ')).toBe('#00ffff');
    });

    it('clamps rgb values', () => {
      expect(parseColourInput('rgb(300, 0, 128)')).toBe('#ff0080');
    });

    it('returns null for invalid rgb', () => {
      expect(parseColourInput('rgb(255, 0)')).toBeNull();
      expect(parseColourInput('rgba(255, 0, 0, 1)')).toBeNull();
    });
  });
});

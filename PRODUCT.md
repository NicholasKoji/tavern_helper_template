# Product

## Register

product

## Users

SillyTavern users who play or author Tavern Helper character cards, especially the "world debug mode" NPC scenario. They
read the status bar inside a chat message iframe while continuing the roleplay, so the interface must be compact,
legible, and quick to scan.

## Product Purpose

This project packages Tavern Helper frontend interfaces and scripts for character cards. The current product surface is
a status bar for "世界调试模式（NPC版）", showing world state, NPC condition, rule stability, recent changes, inventory,
and narrative guardrails. Success means the player can understand the live world variables without leaving the story
flow.

## Brand Personality

Precise, tense, restrained. The interface should feel like an in-world diagnostic instrument, not a generic dashboard or
decorative roleplay card.

## Anti-references

Avoid plain debug tables, flat bordered boxes, generic SaaS cards, heavy neon hacker themes, over-decorated fantasy
panels, glassmorphism, and visual effects that make the iframe taller than necessary.

## Design Principles

Prioritize scan speed: surface the world condition, player risk, and newest changes before secondary detail.

Preserve narrative immersion: labels and hierarchy should feel like a monitoring console embedded in the story.

Keep density humane: compact is good, cramped is not.

Make state visible: meters, tags, and status indicators should communicate safe, warning, and danger states without
relying only on color.

Respect iframe constraints: no viewport-height layouts, no horizontal overflow, and no interaction pattern that assumes
a full app shell.

## Accessibility & Inclusion

Aim for WCAG AA contrast, keyboard-neutral static content, readable Chinese text at small sizes, and
reduced-motion-friendly transitions. Semantic state should be available through labels as well as color.

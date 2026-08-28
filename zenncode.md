# ZennCode Folder Guide

Framework: Next.js
Architecture: Type-Based / Technical Folder Structure
Base directory: `app`

This file explains each generated folder and gives sample starter files.

## `docs`
Description: Project documentation, architecture notes, and onboarding guides.
Sample files:
- `README.md`

## `tests`
Description: Unit, integration, and end-to-end tests for the app.
Sample files:
- `README.md`

## `app/assets`
Description: Static files used by the UI, such as images and icons.
Sample files:
- `images/hero-banner.png`
- `icons/menu.svg`

## `app/assets/images`
Description: Image assets for screens, cards, banners, and other visuals.
Sample files:
- `hero-banner.png`

## `app/assets/icons`
Description: Icon files used in navigation, buttons, and status indicators.
Sample files:
- `menu.svg`

## `app/components`
Description: Reusable UI building blocks shared across multiple pages/screens.
Sample files:
- `ui/button.tsx`
- `layout/Navbar.tsx`

## `app/components/common`
Description: Shared feature-agnostic components used in many places.
Sample files:
- `EmptyState.tsx`

## `app/components/ui`
Description: Low-level design system components such as buttons and inputs.
Sample files:
- `button.tsx`

## `app/components/layout`
Description: Structural components that define app chrome, headers, and shells.
Sample files:
- `Navbar.tsx`

## `app/layouts`
Description: Page layout wrappers that organize global UI structure.
Sample files:
- `MainLayout.tsx`

## `app/pages`
Description: Top-level view pages connected to routing.
Sample files:
- `AppRoutes.tsx`

## `app/services`
Description: Data and API access layer for backend communication.
Sample files:
- `api.ts`

## `app/hooks`
Description: Custom React hooks for reusable stateful behavior.
Sample files:
- `useAuth.ts`

## `app/context`
Description: React context providers and shared app state containers.
Sample files:
- `AuthContext.tsx`

## `app/utils`
Description: Pure helper functions and reusable utility logic.
Sample files:
- `formatDate.ts`

## `app/constants`
Description: Shared constant values, enums, and app-level configuration tokens.
Sample files:
- `app.ts`

## `app/styles`
Description: Global styling files and theme definitions.
Sample files:
- `globals.css`

## `app/lib`
Description: Internal infrastructure helpers and low-level integrations.
Sample files:
- `httpClient.ts`

## `app/types`
Description: Type definitions and shared interfaces.
Sample files:
- `index.d.ts`

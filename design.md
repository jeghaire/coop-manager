# Design Preferences

This document guides AI assistants on design preferences for this project.

## UI/UX Design

- **Framework**: shadcn/ui with Tailwind CSS for consistent, accessible components.
- **Theme**: Support for dark and light modes using CSS variables.
- **Color Scheme**: Neutral grays (#f8f9fa for light backgrounds, #1a1a1a for dark), accent colors from shadcn defaults (e.g., blue-600).
- **Typography**: Geist or system fonts for readability; headings use font-semibold, body text normal weight.
- **Layout**: Mobile-first responsive design; use flexbox/grid for layouts; max-width containers for content.
- **Components**: Favor shadcn components (Button, Card, Dialog, etc.); ensure accessibility with proper ARIA labels.

## Code Structure

- **Component Organization**: Functional components with hooks; separate concerns (logic, UI, types).
- **Styling**: Tailwind classes in JSX; custom CSS only for complex animations or overrides.
- **State Management**: React hooks for local state; Context or Zustand for global state if needed.
- **File Naming**: kebab-case for files (e.g., `user-profile.tsx`), PascalCase for components.
- **Imports**: Group imports (React, then libraries, then local components).

## Project Conventions

- **Icons**: Lucide React icons for consistency.
- **Forms**: React Hook Form with validation.
- **Data Fetching**: Server actions or tRPC for API calls.
- **Error Handling**: User-friendly error messages; loading states with skeletons.

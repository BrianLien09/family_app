# AGENTS.md - Coding Agent Guidelines

This document provides guidelines for AI coding agents working in this Next.js family utility app repository.

## 📦 Project Overview

- **Framework**: Next.js 16.1.1 (App Router) with React 19.2.3
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with glassmorphism design
- **Backend**: Firebase (Firestore + Auth)
- **Deployment**: Static export to GitHub Pages
- **No Testing Framework**: Currently no Jest/Vitest/Playwright configured

## 🛠️ Build & Development Commands

```bash
# Development server (localhost:3000)
npm run dev

# Production build (outputs to ./out)
npm run build

# Lint all files
npm run lint

# Deploy to GitHub Pages
npm run deploy  # Runs predeploy (build) then deploys
```

**Note**: There is no test command configured. If adding tests, consider Vitest + React Testing Library.

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable UI components
│   ├── DateManager/     # Date-related components
│   └── RecipeManager/   # Recipe-related components
├── hooks/            # Custom React hooks (useDates, useRecipes, useImmersiveMode)
├── lib/              # Third-party configs (firebase.ts)
├── types/            # TypeScript type definitions
└── contexts/         # (Empty - not used)
```

**Path Alias**: Use `@/` for imports (e.g., `import { useDates } from '@/hooks/useDates'`)

## 🎨 Code Style Guidelines

### Import Order
```typescript
// 1. React core imports
import { useState, useEffect, useMemo } from 'react';

// 2. Third-party libraries
import { format, startOfMonth } from 'date-fns';
import clsx from 'clsx';

// 3. UI component libraries
import { Plus, Calendar, Trash2 } from 'lucide-react';

// 4. Internal imports (use @ alias)
import { useDates } from '@/hooks/useDates';
import { DateItem } from '@/types';
import CalendarWidget from '@/components/CalendarWidget';
```

### TypeScript Conventions

**Always use explicit types:**
```typescript
// ✅ Good - Explicit interface
interface ComponentProps {
  items: DateItem[];
  onSelect?: (id: string) => void;  // Optional with '?'
}

// ✅ Good - Type unions for constrained values
type ScaleMode = 'servings' | 'ingredient';

// ❌ Avoid 'any' unless absolutely necessary
```

**Type definitions:**
- Use `interface` for component props and object shapes
- Use `type` for unions, primitives, and function signatures
- Export shared types from `src/types/index.ts`

### Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Files (components) | PascalCase | `CalendarWidget.tsx` |
| Files (hooks/utils) | camelCase | `useDates.tsx`, `firebase.ts` |
| Components | PascalCase | `AddDateModal` |
| Functions/Variables | camelCase | `handleSubmit`, `filteredDates` |
| Constants | UPPER_SNAKE_CASE | `CATEGORIES` |
| Boolean props | `is*`, `has*`, `should*` | `isOpen`, `hasError` |
| Event handlers | `handle*` or `on*` | `handleClick`, `onSubmit` |
| CSS classes | kebab-case | `glass-card`, `btn-primary` |

### Component Structure

All components must follow this pattern:

```typescript
'use client';  // Mark client components explicitly

import { useState, useEffect } from 'react';

interface MyComponentProps {
  title: string;
  onClose?: () => void;
}

export default function MyComponent({ title, onClose }: MyComponentProps) {
  // 1. Hooks (useState, useEffect, custom hooks)
  const [state, setState] = useState<string>('');
  const { data, isLoaded } = useDates();
  
  // 2. Computed values (useMemo/useCallback)
  const filtered = useMemo(() => 
    data.filter(item => item.title.includes(state)), 
    [data, state]
  );
  
  // 3. Handler functions
  const handleAction = () => {
    setState('new value');
    onClose?.();
  };
  
  // 4. Early returns for loading states
  if (!isLoaded) return <div>載入中...</div>;
  
  // 5. JSX return
  return (
    <div className="glass-card p-4">
      <h2>{title}</h2>
      {/* Component content */}
    </div>
  );
}
```

### Styling Guidelines

**Tailwind-first approach:**
```tsx
// ✅ Good - Inline Tailwind utilities
<button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg">

// ✅ Good - Use clsx for conditional classes
<div className={clsx(
  "base-class transition-all",
  isActive && "bg-purple-500 text-white",
  !isActive && "bg-white/5 text-slate-300"
)}>

// ✅ Good - Custom utilities in globals.css for reusable patterns
// .glass-card, .btn-primary, .custom-scrollbar

// ❌ Avoid - Creating component-specific CSS files
```

**Design system:**
- Background: `#0f111a`
- Glass cards: `bg-white/5 backdrop-blur-md border border-white/10`
- Accent colors: Purple/pink/orange gradients
- Responsive: Mobile-first with `md:`, `lg:` breakpoints

### State Management

**Use local state + custom hooks pattern:**
```typescript
// ✅ Component state for UI
const [isOpen, setIsOpen] = useState(false);

// ✅ Custom hooks for Firebase data
const { dates, addDate, deleteDate, isLoaded } = useDates();

// ❌ No global state library (Redux, Zustand) - keep it simple
```

**Firebase CRUD pattern:**
- Custom hooks (`useDates`, `useRecipes`) handle all Firebase operations
- LocalStorage caching for instant UI updates
- Optimistic updates with rollback on error
- Toast notifications for user feedback

### Error Handling

```typescript
// ✅ Good - Try-catch with user feedback
const handleDelete = async (id: string) => {
  const previous = [...data];
  
  try {
    // Optimistic update
    setData(prev => prev.filter(item => item.id !== id));
    await deleteDoc(doc(db, 'collection', id));
    
    // Success toast with undo
    toast((t) => (
      <span>
        已刪除 
        <button onClick={() => handleUndo(previous)}>復原</button>
      </span>
    ));
  } catch (error) {
    // Rollback on error
    setData(previous);
    toast.error('刪除失敗，請稍後再試');
    console.error('Delete error:', error);
  }
};
```

### Accessibility Requirements

**Always include:**
- `aria-label` for icon-only buttons
- `aria-pressed` for toggle buttons
- `aria-modal="true"` for modals
- Semantic HTML (`<nav>`, `<main>`, `<button>`)
- ESC key to close modals
- Tab navigation support
- Focus management in modals (`autoFocus` on first input)

```tsx
// ✅ Good example
<button
  onClick={handleToggle}
  aria-label="切換篩選器"
  aria-pressed={isOpen}
  className="..."
>
  <Filter size={16} />
</button>
```

## 🔥 Firebase Integration

**Authentication:**
- Use `onAuthStateChanged` listener in hooks
- Store user-specific data in Firestore with UID
- LocalStorage cache keys include UID: `dates_${user.uid}`

**Firestore structure:**
```
users/
  {uid}/
    dates/
      {docId}/
        title, date, time, category, description, createdAt
    recipes/
      {docId}/
        title, baseServings, ingredients[], createdAt
```

## 🚨 Common Pitfalls

1. **Don't import hooks in non-client components** - All hooks require `'use client'`
2. **Don't use `any` type** - Prefer `unknown` or explicit types
3. **Don't create component-specific CSS files** - Use Tailwind or `globals.css` utilities
4. **Don't forget loading states** - Always check `isLoaded` before rendering data
5. **Don't skip error handling** - All async operations need try-catch
6. **Don't hardcode text** - Currently Chinese only, but keep text extractable for future i18n

## 📝 Git Commit Conventions

Follow this format:
```
type: 簡短描述

- 功能說明（中文）
- 修改細節
- 影響範圍

修改檔案：
- src/path/to/file.tsx
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `style`, `test`, `chore`

## 🎯 Current Architecture Patterns

**Custom Hook Pattern** (see `useDates.tsx`, `useRecipes.tsx`):
1. LocalStorage cache restoration on mount
2. Firebase fetch with cache-first loading
3. Optimistic UI updates
4. Toast notifications with undo functionality

**Immersive Mode** (see `useImmersiveMode.ts`):
- Lock body scroll when modal opens
- Force-hide navbar during immersive view
- Clean up on unmount

**Smart Navbar**:
- Auto-hide on scroll down (>100px)
- Auto-show on scroll up
- Smooth transitions

---

**Last Updated**: 2026-01-19  
**Version**: v3.0  
**For questions**: See README.md or existing component implementations

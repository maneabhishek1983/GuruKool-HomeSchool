'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';

interface AccessibilityContextType {
  focusFirstInteractiveElement: () => void;
  focusTrap: (containerRef: React.RefObject<HTMLElement>) => void;
  announceToScreenReader: (message: string) => void;
}

const AccessibilityContext = createContext<
  AccessibilityContextType | undefined
>(undefined);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      'useAccessibility must be used within an AccessibilityProvider'
    );
  }
  return context;
}

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({
  children,
}: AccessibilityProviderProps) {
  const skipLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    let firstTabHandled = false;
    // Focus management for keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      // On first Tab anywhere, move focus to Skip link to guarantee visible :focus target
      if (event.key === 'Tab' && event.shiftKey === false && !firstTabHandled) {
        const skipLink = document.getElementById(
          'skip-to-main'
        ) as HTMLAnchorElement | null;
        if (skipLink) {
          event.preventDefault();
          firstTabHandled = true;
          skipLink.focus();
          return;
        }
      }

      // Handle escape key to close modals/dropdowns
      if (event.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.getAttribute('role') === 'dialog') {
          const closeButton = activeElement.querySelector(
            '[data-close]'
          ) as HTMLElement;
          if (closeButton) {
            closeButton.click();
          }
        }
      }
    };

    // Add focus indicators for keyboard navigation
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA'
      ) {
        target.classList.add('focus-visible');
      }
    };

    const handleFocusOut = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      target.classList.remove('focus-visible');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const focusFirstInteractiveElement = () => {
    const mainContent =
      document.querySelector('main') || document.querySelector('[role="main"]');
    if (mainContent) {
      const firstInteractive = mainContent.querySelector(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      if (firstInteractive) {
        firstInteractive.focus();
      }
    }
  };

  const focusTrap = (containerRef: React.RefObject<HTMLElement>) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const focusableElements = container.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const contextValue: AccessibilityContextType = {
    focusFirstInteractiveElement,
    focusTrap,
    announceToScreenReader,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {/* Skip to main content link */}
      <a
        id="skip-to-main"
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        ref={skipLinkRef}
      >
        Skip to main content
      </a>

      {children}

      {/* Screen reader announcements */}
      <div
        id="sr-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </AccessibilityContext.Provider>
  );
}

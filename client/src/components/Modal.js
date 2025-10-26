import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Modal Component with React Portal
 * Ensures modals are always rendered at the root level, above all other content
 * 
 * Props:
 * - isOpen: boolean - Controls modal visibility
 * - onClose: function - Callback when modal should close
 * - title: string - Modal title
 * - size: string - 'sm', 'md', 'lg', 'xl' (default: 'md')
 * - children: React nodes - Modal content
 * - showFooter: boolean - Show footer section (default: true)
 * - footer: React node - Custom footer content
 */

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  size = 'md', 
  children, 
  showFooter = true,
  footer 
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      // Prevent scroll on iOS
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.width = '';
      const scrollY = document.body.style.top;
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-portal-overlay" onClick={onClose}>
      <div 
        className={`modal-portal-content modal-portal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-portal-header">
          <h3 className="modal-portal-title">{title}</h3>
          <button 
            className="modal-portal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-portal-body">
          {children}
        </div>
        
        {showFooter && footer && (
          <div className="modal-portal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render modal using React Portal at document.body level
  return createPortal(modalContent, document.body);
};

export default Modal;
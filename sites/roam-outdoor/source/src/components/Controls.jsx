import { forwardRef } from 'react';
import Icon from './Icon';

export const Button = forwardRef(function Button({ children, icon, iconPosition = 'end', variant = 'secondary', className = '', type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={`ui-button ui-button--${variant} ${icon ? `ui-button--icon-${iconPosition}` : ''} ${className}`} {...props}>
    {icon && iconPosition === 'start' && <span className="ui-button__icon"><Icon name={icon} size={18}/></span>}
    <span className="ui-button__label">{children}</span>
    {icon && iconPosition === 'end' && <span className="ui-button__icon"><Icon name={icon} size={18}/></span>}
  </button>;
});

export const IconButton = forwardRef(function IconButton({ icon, tone = 'surface', className = '', type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={`ui-icon-button ui-icon-button--${tone} ${className}`} {...props}><Icon name={icon} size={18}/></button>;
});

export function QuantityControl({ value, min = 1, max = 99, onChange, label = '商品' }) {
  return <div className="quantity-control" role="group" aria-label={`${label}数量`}>
    <IconButton icon="minus" tone="bare" disabled={value <= min} aria-label={`减少${label}数量`} onClick={() => onChange(value - 1)}/>
    <span className="quantity-value mono" aria-live="polite">{value}</span>
    <IconButton icon="plus" tone="bare" disabled={value >= max} aria-label={`增加${label}数量`} onClick={() => onChange(value + 1)}/>
  </div>;
}

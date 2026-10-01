export const icon = (name) => <i className={`fa-solid ${name}`} />;
export const money = (value) => `₹${Number(value).toFixed(2)}`;
export function Pack({ product, small = false }) { return <div className="pack" style={{ background: `linear-gradient(145deg,${product.c1},${product.c2})`, fontSize: small ? 18 : 28 }}>{icon(product.icon)}<span /></div>; }
export function Empty({ iconName, children }) { return <div className="empty">{icon(iconName)}<span>{children}</span></div>; }
export function Button({ children, className = 'soft', ...props }) { return <button className={`btn ${className}`} {...props}>{children}</button>; }

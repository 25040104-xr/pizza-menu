import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import pizzaData from './data';

const OPEN_HOUR = 10;
const CLOSE_HOUR = 22;
const DELIVERY_FEE = 3;
const STEP_SECONDS = 6;

const ORDER_STEPS = {
    delivery: ['Order received', 'Preparing', 'In the oven', 'Out for delivery', 'Delivered'],
    pickup: ['Order received', 'Preparing', 'In the oven', 'Ready for pickup', 'Collected'],
};

function formatMinutes(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

function getShopStatus(now) {
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const openAt = OPEN_HOUR * 60;
    const closeAt = CLOSE_HOUR * 60;
    const isOpen = minutesNow >= openAt && minutesNow < closeAt;

    let minsLeft;
    if (isOpen) {
        minsLeft = closeAt - minutesNow;
    } else if (minutesNow < openAt) {
        minsLeft = openAt - minutesNow;
    } else {
        minsLeft = 24 * 60 - minutesNow + openAt;
    }
    return { isOpen, timeText: formatMinutes(minsLeft) };
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function generateOrderId() {
    return '#' + Math.floor(1000 + Math.random() * 9000);
}

function Header({ showCart, cartCount, onCartClick }) {
    return (
        <header className="header">
            <h1>Andy's Pizza Co.</h1>
            {showCart && (
                <button
                    className="cart-link"
                    onClick={onCartClick}
                    disabled={cartCount === 0}
                    aria-label={`View cart, ${cartCount} items`}
                >
                    Cart <span className="badge">{cartCount}</span>
                </button>
            )}
        </header>
    );
}

function DemoBanner({ onExit }) {
    return (
        <div className="demo-banner" role="status">
            <span>
                <strong>Demo mode:</strong> ordering is switched on outside opening hours so you can try it out.
            </span>
            <button className="link-btn" onClick={onExit}>
                Exit demo
            </button>
        </div>
    );
}

function Menu({ canOrder, cart, onAddToCart }) {
    return (
        <main className="menu">
            <h2>Our Menu</h2>
            {canOrder && <p>Authentic Italian cuisine, all from our stone oven</p>}

            <ul className="pizzas">
                {pizzaData.map((pizza) => {
                    const inCart = cart.find((item) => item.name === pizza.name);
                    return (
                        <Pizza
                            key={pizza.name}
                            name={pizza.name}
                            ingredients={pizza.ingredients}
                            price={pizza.price}
                            photo={pizza.photoName}
                            soldOut={pizza.soldOut}
                            canOrder={canOrder}
                            quantity={inCart ? inCart.quantity : 0}
                            onAdd={() => onAddToCart(pizza)}
                        />
                    );
                })}
            </ul>
        </main>
    );
}

function Pizza({ name, ingredients, price, photo, soldOut, canOrder, quantity, onAdd }) {
    let buttonText = '+ Add to cart';
    if (soldOut) buttonText = 'Unavailable';
    else if (!canOrder) buttonText = `Opens at ${OPEN_HOUR}am`;
    else if (quantity > 0) buttonText = `+ Add another (${quantity})`;

    return (
        <li className={`pizza ${soldOut ? 'sold-out' : ''}`}>
            <img src={photo} alt={name} />
            <div>
                <h3>{name}</h3>
                <p>{ingredients}</p>
                <span>{soldOut ? 'SOLD OUT' : `$${price}`}</span>
                <button className="add-btn" onClick={onAdd} disabled={soldOut || !canOrder}>
                    {buttonText}
                </button>
            </div>
        </li>
    );
}

function CartBar({ totalItems, totalPrice, onCheckout }) {
    return (
        <div className="cart-bar" role="region" aria-label="Cart summary">
            <span>
                {totalItems} {totalItems === 1 ? 'pizza' : 'pizzas'} · <strong>${totalPrice}</strong>
            </span>
            <button className="btn" onClick={onCheckout}>
                Checkout →
            </button>
        </div>
    );
}

function Order({ note, totalItems, totalPrice, onCheckout }) {
    return (
        <div className="order">
            <p>
                We're currently open
                {note && (
                    <>
                        {' · '}
                        <span className="countdown">{note}</span>
                    </>
                )}
            </p>
            <button className="btn" onClick={onCheckout} disabled={totalItems === 0}>
                {totalItems === 0 ? 'Add a pizza to order' : `Order now · $${totalPrice}`}
            </button>
        </div>
    );
}

function Footer({ status, demoMode, onStartDemo, totalItems, totalPrice, onCheckout }) {
    let content;
    if (status.isOpen || demoMode) {
        content = (
            <Order
                note={status.isOpen ? `Closing in ${status.timeText}` : 'demo mode'}
                totalItems={totalItems}
                totalPrice={totalPrice}
                onCheckout={onCheckout}
            />
        );
    } else {
        content = (
            <div className="closed">
                <p>Sorry, we're closed</p>
                <p className="countdown">We open in {status.timeText}</p>
                <p className="hours">Open daily 10am – 10pm</p>
                <button className="link-btn" onClick={onStartDemo}>
                    Just looking? Try the ordering demo
                </button>
            </div>
        );
    }
    return <footer className="footer">{content}</footer>;
}

function OrderSummary({ title = 'Your order', cart, onChangeQty, deliveryFee, children }) {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + deliveryFee;

    return (
        <div className="card summary">
            <h3>{title}</h3>
            <ul>
                {cart.map((item) => (
                    <li key={item.name} className="cart-item">
                        <span>{item.name}</span>
                        {onChangeQty ? (
                            <div className="qty">
                                <button
                                    type="button"
                                    onClick={() => onChangeQty(item.name, -1)}
                                    aria-label={`Remove one ${item.name}`}
                                >
                                    −
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => onChangeQty(item.name, 1)}
                                    aria-label={`Add one ${item.name}`}
                                >
                                    +
                                </button>
                            </div>
                        ) : (
                            <span className="qty-static">× {item.quantity}</span>
                        )}
                        <span className="cart-price">${item.price * item.quantity}</span>
                    </li>
                ))}
            </ul>

            <div className="summary-totals">
                <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${subtotal}</span>
                </div>
                {deliveryFee > 0 && (
                    <div className="summary-row">
                        <span>Delivery fee</span>
                        <span>${deliveryFee}</span>
                    </div>
                )}
                <div className="summary-row summary-total">
                    <span>Total</span>
                    <span>${total}</span>
                </div>
            </div>
            {children}
        </div>
    );
}

function Field({ id, label, error, children }) {
    return (
        <div className={`field ${error ? 'has-error' : ''}`}>
            <label htmlFor={id}>{label}</label>
            {children}
            {error && (
                <p className="field-error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

function Checkout({ cart, onChangeQty, onBack, onPlaceOrder }) {
    const [form, setForm] = useState({
        name: '',
        phone: '',
        method: 'delivery',
        address: '',
        notes: '',
    });
    const [errors, setErrors] = useState({});

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = form.method === 'delivery' ? DELIVERY_FEE : 0;
    const total = subtotal + deliveryFee;

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: undefined }));
    }

    function validate() {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Please enter your name.';
        if (form.phone.replace(/\D/g, '').length < 8) newErrors.phone = 'Please enter a valid phone number.';
        if (form.method === 'delivery' && !form.address.trim())
            newErrors.address = 'Please enter a delivery address.';
        return newErrors;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const newErrors = validate();
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            onPlaceOrder({ ...form, subtotal, deliveryFee, total });
        }
    }

    if (cart.length === 0) {
        return (
            <section className="checkout empty-cart">
                <h2 className="page-title">Your cart is empty</h2>
                <p>Add a pizza or two to get started.</p>
                <button className="btn" onClick={onBack}>
                    Back to menu
                </button>
            </section>
        );
    }

    return (
        <section className="checkout" aria-labelledby="checkout-title">
            <button className="back-btn" onClick={onBack}>
                ← Back to menu
            </button>
            <h2 id="checkout-title" className="page-title">
                Checkout
            </h2>

            <div className="checkout-grid">
                <OrderSummary cart={cart} onChangeQty={onChangeQty} deliveryFee={deliveryFee} />

                <form className="card checkout-form" onSubmit={handleSubmit} noValidate>
                    <h3>Your details</h3>

                    <Field id="name" label="Name" error={errors.name}>
                        <input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            autoComplete="name"
                            aria-invalid={!!errors.name}
                        />
                    </Field>

                    <Field id="phone" label="Phone number" error={errors.phone}>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                            autoComplete="tel"
                            aria-invalid={!!errors.phone}
                        />
                    </Field>

                    <fieldset className="method">
                        <legend>Delivery or pickup?</legend>
                        <div className="options">
                            <label className={`option ${form.method === 'delivery' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="method"
                                    value="delivery"
                                    checked={form.method === 'delivery'}
                                    onChange={handleChange}
                                />
                                Delivery (+${DELIVERY_FEE})
                            </label>
                            <label className={`option ${form.method === 'pickup' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="method"
                                    value="pickup"
                                    checked={form.method === 'pickup'}
                                    onChange={handleChange}
                                />
                                Pickup (free)
                            </label>
                        </div>
                    </fieldset>

                    {form.method === 'delivery' && (
                        <Field id="address" label="Delivery address" error={errors.address}>
                            <textarea
                                id="address"
                                name="address"
                                rows="2"
                                value={form.address}
                                onChange={handleChange}
                                autoComplete="street-address"
                                aria-invalid={!!errors.address}
                            />
                        </Field>
                    )}

                    <Field id="notes" label="Notes (optional)">
                        <textarea
                            id="notes"
                            name="notes"
                            rows="2"
                            placeholder="e.g. extra crispy, no onions"
                            value={form.notes}
                            onChange={handleChange}
                        />
                    </Field>

                    <button type="submit" className="btn btn-full">
                        Place order · ${total}
                    </button>
                </form>
            </div>
        </section>
    );
}

function Confirmation({ order, onNewOrder }) {
    const steps = ORDER_STEPS[order.method];
    const [step, setStep] = useState(0);
    const isFinished = step === steps.length - 1;

    useEffect(() => {
        if (isFinished) return;
        const timer = setTimeout(() => setStep((s) => s + 1), STEP_SECONDS * 1000);
        return () => clearTimeout(timer);
    }, [step, isFinished]);

    const progress = (step / (steps.length - 1)) * 100;
    const firstName = order.name.split(' ')[0];

    return (
        <section className="confirmation" aria-labelledby="confirm-title">
            <div className="check" aria-hidden="true">
                ✓
            </div>
            <h2 id="confirm-title">Thanks, {firstName}!</h2>
            <p>
                Order <strong>{order.id}</strong> is confirmed.
            </p>
            <p className="eta">
                Estimated {order.method === 'delivery' ? 'delivery' : 'pickup'} time:{' '}
                <strong>{formatTime(order.eta)}</strong>
            </p>

            <div className="card tracker-card">
                <p className="status-now" aria-live="polite">
                    {isFinished ? `${steps[step]}. Enjoy your meal!` : `${steps[step]}…`}
                </p>
                <div className="progress">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <ol className="tracker">
                    {steps.map((label, i) => (
                        <li
                            key={label}
                            className={`${i <= step ? 'done' : ''} ${i === step && !isFinished ? 'active' : ''}`}
                        >
                            <span className="dot" />
                            {label}
                        </li>
                    ))}
                </ol>
                <p className="hours">Demo: the status updates every few seconds.</p>
            </div>

            <OrderSummary title="Order summary" cart={order.items} deliveryFee={order.deliveryFee}>
                <div className="delivery-info">
                    {order.method === 'delivery' ? (
                        <p>
                            <strong>Delivering to:</strong> {order.address}
                        </p>
                    ) : (
                        <p>
                            <strong>Pickup at:</strong> Andy's Pizza Co.
                        </p>
                    )}
                    <p>
                        <strong>Phone:</strong> {order.phone}
                    </p>
                    {order.notes && (
                        <p>
                            <strong>Notes:</strong> {order.notes}
                        </p>
                    )}
                </div>
            </OrderSummary>

            <button className="btn" onClick={onNewOrder}>
                Order again
            </button>
        </section>
    );
}

function App() {
    const [now, setNow] = useState(new Date());
    const [cart, setCart] = useState([]);
    const [view, setView] = useState('menu'); // 'menu' | 'checkout' | 'confirmation'
    const [order, setOrder] = useState(null);
    const [demoMode, setDemoMode] = useState(false);

    // Keep the clock live so open/closed and the countdown update by themselves
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [view]);

    const status = getShopStatus(now);
    const canOrder = status.isOpen || demoMode;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    function addToCart(pizza) {
        setCart((current) => {
            const existing = current.find((item) => item.name === pizza.name);
            if (existing) {
                return current.map((item) =>
                    item.name === pizza.name ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...current, { name: pizza.name, price: pizza.price, quantity: 1 }];
        });
    }

    function changeQuantity(name, change) {
        setCart((current) =>
            current
                .map((item) => (item.name === name ? { ...item, quantity: item.quantity + change } : item))
                .filter((item) => item.quantity > 0)
        );
    }

    function placeOrder(details) {
        const minutes = details.method === 'delivery' ? 40 : 20;
        setOrder({
            id: generateOrderId(),
            items: cart,
            name: details.name.trim(),
            phone: details.phone,
            method: details.method,
            address: details.address.trim(),
            notes: details.notes.trim(),
            deliveryFee: details.deliveryFee,
            total: details.total,
            eta: new Date(Date.now() + minutes * 60000),
        });
        setCart([]);
        setView('confirmation');
    }

    function startNewOrder() {
        setOrder(null);
        setView('menu');
    }

    return (
        <div className="container">
            <Header showCart={view === 'menu'} cartCount={totalItems} onCartClick={() => setView('checkout')} />

            {demoMode && !status.isOpen && <DemoBanner onExit={() => setDemoMode(false)} />}

            {view === 'menu' && (
                <>
                    <Menu canOrder={canOrder} cart={cart} onAddToCart={addToCart} />
                    {totalItems > 0 && canOrder && (
                        <CartBar
                            totalItems={totalItems}
                            totalPrice={totalPrice}
                            onCheckout={() => setView('checkout')}
                        />
                    )}
                    <Footer
                        status={status}
                        demoMode={demoMode}
                        onStartDemo={() => setDemoMode(true)}
                        totalItems={totalItems}
                        totalPrice={totalPrice}
                        onCheckout={() => setView('checkout')}
                    />
                </>
            )}

            {view === 'checkout' && (
                <Checkout
                    cart={cart}
                    onChangeQty={changeQuantity}
                    onBack={() => setView('menu')}
                    onPlaceOrder={placeOrder}
                />
            )}

            {view === 'confirmation' && order && <Confirmation order={order} onNewOrder={startNewOrder} />}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
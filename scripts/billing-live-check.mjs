import assert from 'node:assert/strict';

const apiBase = process.env.FORM_GUARD_BILLING_API || 'https://api.sociobot.in/api/v1';
const slug = 'dyslexia-form-guard';

// @claim:guard-plus-checkout

const catalogResponse = await fetch(`${apiBase}/products`, {
  headers: { accept: 'application/json' }
});
assert.equal(catalogResponse.status, 200, 'The Sociobot product catalog must be available.');
const catalog = await catalogResponse.json();
const product = catalog.data?.find((entry) => entry.slug === slug);
assert.ok(product, `The public billing catalog must contain ${slug}.`);
assert.equal(product.price_minor, 1200, 'Guard+ must remain a $12 one-time purchase.');
assert.equal(product.currency, 'USD', 'Guard+ must be sold in USD.');
assert.equal(product.product_url, 'https://dyslexia-form-guard.sociobot.in/');

const checkoutResponse = await fetch(`${apiBase}/products/${slug}/checkout`, {
  headers: { accept: 'text/html,application/xhtml+xml' },
  redirect: 'manual'
});
assert.ok(
  [302, 303, 307, 308].includes(checkoutResponse.status),
  `Guard+ checkout must redirect to hosted checkout, received HTTP ${checkoutResponse.status}.`
);
const location = checkoutResponse.headers.get('location');
assert.ok(location, 'Guard+ checkout redirect must include a Location header.');
const checkoutUrl = new URL(location);
assert.equal(checkoutUrl.protocol, 'https:');
assert.equal(checkoutUrl.hostname, 'checkout.dodopayments.com');
assert.match(checkoutUrl.pathname, /^\/session\/cks_[A-Za-z0-9]+$/);

console.log('Guard+ is listed at $12 and redirects to a real Dodo hosted checkout session.');

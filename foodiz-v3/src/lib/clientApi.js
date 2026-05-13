import { supabase } from './supabaseClient';

export const CLIENT_CATEGORIES = [
  'Restaurants',
  'Market',
  'Halal',
  'Asiatique',
  'Pizzas',
  'Burgers',
  'Gastronomique',
  'Gourmandises',
];

export async function fetchPartners(establishmentType) {
  if (!supabase) return { data: [], error: null };

  let query = supabase
    .from('partner_public_view')
    .select('*')
    .order('created_at', { ascending: false });

  if (establishmentType) {
    query = query.eq('establishment_type', establishmentType);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function fetchPartnerById(partnerId) {
  if (!supabase || !partnerId) return { data: null, error: null };

  const { data, error } = await supabase
    .from('partner_public_view')
    .select('*')
    .eq('partner_id', partnerId)
    .maybeSingle();

  return { data: data ?? null, error };
}

export async function fetchProductsByPartnerId(partnerId) {
  if (!supabase || !partnerId) return { data: [], error: null };

  const { data, error } = await supabase
    .from('product_public_view')
    .select('*')
    .eq('partner_id', partnerId)
    .order('sort_order', { ascending: true });

  return { data: data ?? [], error };
}

export async function fetchCategories() {
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, establishment_type, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return { data: data ?? [], error };
}

export async function fetchClientCartItems() {
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from('client_cart_items_view')
    .select('*')
    .order('cart_id', { ascending: true });

  return { data: data ?? [], error };
}

export async function fetchClientOrders() {
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from('client_order_summary_view')
    .select('*')
    .order('placed_at', { ascending: false });

  return { data: data ?? [], error };
}

export async function fetchClientOrderItems() {
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from('client_order_items_view')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: data ?? [], error };
}

export async function fetchClientAddresses() {
  if (!supabase) return { data: [], error: null };

  const { data, error } = await supabase
    .from('client_addresses')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  return { data: data ?? [], error };
}

export async function fetchLoyaltyAccount(userId) {
  if (!supabase || !userId) return { data: null, error: null };

  const { data, error } = await supabase
    .from('loyalty_accounts')
    .select('*')
    .eq('client_user_id', userId)
    .maybeSingle();

  return { data: data ?? null, error };
}

export function formatPrice(cents = 0) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format((cents || 0) / 100);
}

export function mapCategoryName(categoryId, categories = []) {
  return categories.find((category) => category.id === categoryId)?.name || 'Autres';
}

export function groupProductsByCategory(products = [], categories = []) {
  return products.reduce((acc, product) => {
    const categoryName = mapCategoryName(product.category_id, categories);
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(product);
    return acc;
  }, {});
}

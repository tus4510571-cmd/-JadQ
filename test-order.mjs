import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.argv[2];
const supabaseAnonKey = process.argv[3];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const customer_id = 'a49d73c3-ee7f-4923-8031-7adfd5bd84bf';
  
  const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([{
        order_number: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_id: customer_id,
        order_date: new Date().toISOString(),
        status: 'Pending'
      }])
      .select()
      .single();

  if (orderError) {
    console.error("ORDER ERROR:", orderError);
    return;
  }
  
  console.log("ORDER SUCCESS:", newOrder);

  const items = [
    { design_number: 'Design 1', size: 'S', quantity_ordered: 10, quantity_completed: 0, production_status: 'Pending' }
  ];

  const itemsToInsert = items.map(item => ({
      order_id: newOrder.id,
      design_number: item.design_number,
      size: item.size,
      quantity_ordered: item.quantity_ordered,
      quantity_completed: item.quantity_completed || 0,
      production_status: item.production_status || 'Pending'
    }));

  const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);
      
  if (itemsError) {
    console.error("ITEMS ERROR:", itemsError);
  } else {
    console.log("ITEMS SUCCESS");
  }
}

test();

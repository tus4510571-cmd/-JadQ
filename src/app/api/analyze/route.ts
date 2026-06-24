import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const { timeRange } = await request.json();

    // 1. Initialize Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase config missing" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Fetch Data based on timeRange
    let query = supabase.from("order_items").select(`
      *,
      order:orders(
        order_date,
        customer_id
      )
    `);

    // Apply basic date filters if needed (assuming order_date is in order table, but we might just fetch all and filter in JS for simplicity if data isn't huge)
    const { data: items, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch data from Supabase" }, { status: 500 });
    }

    // Filter in memory based on timeRange for simplicity (assuming order_date exists)
    const now = new Date();
    let filteredItems = items || [];
    
    if (timeRange === "this-month") {
      filteredItems = filteredItems.filter((item: any) => {
        if (!item.order?.order_date) return false;
        const d = new Date(item.order.order_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (timeRange === "last-7-days") {
      filteredItems = filteredItems.filter((item: any) => {
        if (!item.order?.order_date) return false;
        const d = new Date(item.order.order_date);
        const diffTime = Math.abs(now.getTime() - d.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays <= 7;
      });
    }

    // Prepare summary data for the prompt
    const summary: Record<string, Record<string, number>> = {};
    let totalItemsOrdered = 0;
    
    filteredItems.forEach((item: any) => {
      if (!summary[item.design_number]) summary[item.design_number] = {};
      if (!summary[item.design_number][item.size]) summary[item.design_number][item.size] = 0;
      
      summary[item.design_number][item.size] += item.quantity_ordered;
      totalItemsOrdered += item.quantity_ordered;
    });

    // 3. Initialize Gemini
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ 
        error: "GEMINI_API_KEY is not configured in environment variables." 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 4. Construct Prompt
    const prompt = `
    You are an expert data analyst for a garment production factory. 
    Analyze the following order data and provide actionable business insights in Markdown format.
    Keep the response concise, professional, and easy to read.
    
    Time Range Selected: ${timeRange}
    Total Items Ordered: ${totalItemsOrdered}
    
    Raw Data Aggregation (Design -> Size -> Quantity Ordered):
    ${JSON.stringify(summary, null, 2)}
    
    Please provide:
    1. A short executive summary.
    2. The top-selling designs and most popular sizes.
    3. Any anomalies or interesting patterns (e.g., lack of certain sizes).
    4. Business recommendations for production planning.
    `;

    // 5. Generate Content
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ analysis: responseText });

  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

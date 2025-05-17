
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zywabaiezsbutqpjetoh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5d2FiYWllenNidXRxcGpldG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxOTMwNDAsImV4cCI6MjA1OTc2OTA0MH0.ClOC_yGfuMK_t_yzLhIOv09kssXngRAhveKprVap-5A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

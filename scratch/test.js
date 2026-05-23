const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: contract } = await supabase.from('contracts').select('id, raw_text').ilike('name', '%rental%').limit(1).single();
  const { data: clauses } = await supabase.from('contract_clauses').select('clause_text').eq('contract_id', contract.id);
  console.log('Total clauses:', clauses.length);
  let matches = 0;
  for (const clause of clauses) {
    const words = clause.clause_text.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/["“”'‘’]/g, '["“”\'‘’]'));
    const regexStr = words.join('\\s+');
    try {
      const regex = new RegExp(regexStr, 'i');
      const isMatch = regex.test(contract.raw_text);
      if (isMatch) matches++;
      console.log('Clause Match:', isMatch, '| text len:', clause.clause_text.length);
    } catch (e) {
      console.log('Regex syntax error');
    }
  }
  console.log('Total Matches:', matches, '/', clauses.length);
}
run();

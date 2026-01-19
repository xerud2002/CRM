const { DataSource } = require('typeorm');

const accounts = [
  { email: 'office@holdemremovals.co.uk', displayName: 'Office' },
  { email: 'holdemremovals@gmail.com', displayName: 'Gmail' },
  { email: 'alex.burcea@holdemremovals.co.uk', displayName: 'Alex Burcea' },
  { email: 'cr@holdemremovals.co.uk', displayName: 'CR' },
  { email: 'adrian@holdemremovals.co.uk', displayName: 'Adrian' },
  { email: 'customerservice@holdemremovals.co.uk', displayName: 'Customer Service' },
  { email: 'ella.v@holdemremovals.co.uk', displayName: 'Ella V' },
];

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: 'aws-1-eu-west-1.pooler.supabase.com',
    port: 5432,
    username: 'postgres.vpinevfqsbgggnomlxmu',
    password: 'XFkuJHAaLvMUyydp',
    database: 'postgres',
    synchronize: false,
  });
  
  await ds.initialize();
  console.log('Connected to database');
  
  // Check columns
  const cols = await ds.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'email_accounts'");
  console.log('Columns:', cols.map(c => c.column_name));
  
  for (const acc of accounts) {
    const existing = await ds.query('SELECT id FROM email_accounts WHERE email = $1', [acc.email]);
    if (existing.length === 0) {
      const imapHost = acc.email.includes('gmail') ? 'imap.gmail.com' : 'imap.mail.hostinger.com';
      const smtpHost = acc.email.includes('gmail') ? 'smtp.gmail.com' : 'smtp.mail.hostinger.com';
      
      await ds.query(
        `INSERT INTO email_accounts (email, "displayName", "imapHost", "imapPort", "smtpHost", "smtpPort", username, "passwordEncrypted", "isActive") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [acc.email, acc.displayName, imapHost, 993, smtpHost, 587, acc.email, 'PLACEHOLDER_PASSWORD', true]
      );
      console.log('Created:', acc.email);
    } else {
      console.log('Exists:', acc.email);
    }
  }
  
  await ds.destroy();
  console.log('Done!');
}

seed().catch(console.error);

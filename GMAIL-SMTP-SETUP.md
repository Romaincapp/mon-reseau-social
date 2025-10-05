# Configuration Gmail SMTP pour Supabase

## Étape 1 : Créer un App Password Gmail

1. **Allez sur votre compte Google** :
   - https://myaccount.google.com/

2. **Activez la validation en 2 étapes** (si ce n'est pas déjà fait) :
   - Allez dans "Sécurité" → "Validation en 2 étapes"
   - Suivez les instructions pour l'activer

3. **Créez un App Password** :
   - Allez dans "Sécurité" → "Validation en 2 étapes" → "Mots de passe des applications"
   - Ou directement : https://myaccount.google.com/apppasswords
   - Sélectionnez "Autre (nom personnalisé)"
   - Nommez-le : `Supabase Mon Reseau Social`
   - Cliquez sur "Générer"
   - **COPIEZ le mot de passe de 16 caractères** (vous ne pourrez plus le revoir)

## Étape 2 : Configurer SMTP dans Supabase

1. **Allez dans le Dashboard Supabase** :
   - https://supabase.com/dashboard/project/huigtezsbyirenbgwbdt/settings/auth

2. **Trouvez la section "SMTP Settings"** et remplissez :

   ```
   Enable Custom SMTP: ✓ (activé)

   Sender email: votre-email@gmail.com
   Sender name: Voccal

   Host: smtp.gmail.com
   Port: 587

   Username: votre-email@gmail.com
   Password: [Le App Password de 16 caractères généré]

   Admin email: votre-email@gmail.com
   ```

3. **Cliquez sur "Save"**

## Étape 3 : Tester l'inscription

1. Lancez l'app : `npm run dev`

2. Allez sur http://localhost:3000/auth/register

3. Inscrivez-vous avec un nouvel email (peut être n'importe quel email)

4. Vérifiez votre boîte Gmail (l'email sera envoyé DEPUIS votre Gmail)

5. Cliquez sur le lien de confirmation dans l'email

## Remarques importantes

⚠️ **Limites de Gmail** :
- Gmail limite l'envoi à **500 emails/jour** pour un compte gratuit
- Pour la production, utilisez plutôt SendGrid, Mailgun ou AWS SES

⚠️ **Sécurité** :
- Ne partagez JAMAIS votre App Password
- L'App Password est différent de votre mot de passe Gmail normal
- Vous pouvez le révoquer à tout moment dans les paramètres Google

✅ **Avantages** :
- Les emails arrivent vraiment dans les boîtes mail
- Vous pouvez personnaliser l'expéditeur
- Bon pour le développement et les petits projets

## Alternative pour la production

Pour la production, je recommande d'utiliser :
- **SendGrid** (gratuit jusqu'à 100 emails/jour)
- **Mailgun** (gratuit jusqu'à 5000 emails/mois les 3 premiers mois)
- **AWS SES** (très abordable, $0.10 pour 1000 emails)

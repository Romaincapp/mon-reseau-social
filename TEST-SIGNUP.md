# Test d'inscription

## Instructions pour tester l'envoi d'email :

1. Lancez l'app : `npm run dev`

2. Ouvrez la console développeur (F12) avant de vous inscrire

3. Inscrivez-vous avec un nouvel email

4. **Immédiatement après**, exécutez cette commande dans le terminal :
   ```bash
   npx supabase@latest projects api-keys --project-ref huigtezsbyirenbgwbdt
   ```

5. Puis récupérez les logs Auth :
   ```bash
   curl -X GET 'https://huigtezsbyirenbgwbdt.supabase.co/rest/v1/auth/admin/audit' \
     -H "apikey: VOTRE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer VOTRE_SERVICE_ROLE_KEY"
   ```

## Alternative : Vérifier dans le Dashboard

1. Allez sur https://supabase.com/dashboard/project/huigtezsbyirenbgwbdt/auth/users
2. Cherchez votre utilisateur nouvellement créé
3. Il devrait avoir un statut "Waiting for verification" ou similaire
4. Vous pouvez le confirmer manuellement en cliquant sur l'utilisateur

## Configuration recommandée pour recevoir les emails

Dans https://supabase.com/dashboard/project/huigtezsbyirenbgwbdt/auth/providers :

### Option A : Désactiver la confirmation (DEV uniquement)
- Désactivez "Confirm email" dans Email Provider

### Option B : Configurer un SMTP custom (PRODUCTION)
- Ajoutez vos credentials SMTP (Gmail, SendGrid, etc.)

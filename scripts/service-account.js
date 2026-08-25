/**
 * Résolution de la clé de service Firebase Admin.
 *
 * La clé donne un accès administrateur complet au projet et contourne toutes
 * les règles de sécurité : elle ne doit pas vivre dans l'arborescence du dépôt,
 * où une archive, une synchronisation cloud ou un `git add -f` la publierait.
 *
 * Emplacements consultés, dans l'ordre :
 *   1. $GOOGLE_APPLICATION_CREDENTIALS
 *   2. ~/.go-gourmet/serviceAccountKey.json      (emplacement recommandé)
 *   3. scripts/serviceAccountKey.json            (ancien, signalé)
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const HOME_KEY_PATH = path.join(os.homedir(), '.go-gourmet', 'serviceAccountKey.json');
const LEGACY_KEY_PATH = path.join(__dirname, 'serviceAccountKey.json');

export const resolveServiceAccountPath = () => {
  const fromEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  if (fs.existsSync(HOME_KEY_PATH)) return HOME_KEY_PATH;

  if (fs.existsSync(LEGACY_KEY_PATH)) {
    console.warn(
      '\x1b[33m⚠  La clé de service se trouve encore dans scripts/.\x1b[0m\n' +
      `   Déplacez-la vers ${HOME_KEY_PATH}\n`
    );
    return LEGACY_KEY_PATH;
  }

  return null;
};

export const loadServiceAccount = () => {
  const keyPath = resolveServiceAccountPath();

  if (!keyPath) {
    console.error(
      '\nClé de service introuvable.\n\n' +
      'Récupérez-la dans la console Firebase (Paramètres du projet →\n' +
      'Comptes de service → Générer une nouvelle clé privée), puis placez-la ici :\n' +
      `  ${HOME_KEY_PATH}\n\n` +
      'ou pointez GOOGLE_APPLICATION_CREDENTIALS dessus.\n'
    );
    process.exit(1);
  }

  return { keyPath, serviceAccount: JSON.parse(fs.readFileSync(keyPath, 'utf8')) };
};

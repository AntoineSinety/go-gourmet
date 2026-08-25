/**
 * Tests des règles Firestore sans émulateur.
 *
 * L'émulateur Firebase exige Java. À défaut, ce script envoie le jeu de règles
 * à l'API `firebaserules.projects.test`, qui l'évalue côté serveur contre des
 * requêtes simulées et renvoie ALLOW ou DENY pour chacune.
 *
 * Rien n'est déployé et aucune donnée n'est touchée : l'API évalue une source
 * de règles fournie dans le corps de la requête.
 *
 *   node scripts/test-firestore-rules.js
 */
import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const keyPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(keyPath)) {
  console.error(`Clé de service introuvable : ${keyPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const projectId = serviceAccount.project_id;

const credential = admin.credential.cert(serviceAccount);

// ---------------------------------------------------------------------------
// Acteurs de test
// ---------------------------------------------------------------------------

const MEMBRE = 'uid_membre';        // appartient au foyer A
const AUTRE = 'uid_autre';          // appartient au foyer B
const INTRUS = 'uid_intrus';        // connecté, sans foyer
const FOYER_A = 'foyerA';
const FOYER_B = 'foyerB';

/** Les documents que les règles liront via get() pendant l'évaluation. */
const MOCK_DOCS = [
  {
    path: `/databases/(default)/documents/users/${MEMBRE}`,
    data: { householdId: FOYER_A, email: 'membre@example.com' }
  },
  {
    path: `/databases/(default)/documents/users/${AUTRE}`,
    data: { householdId: FOYER_B, email: 'autre@example.com' }
  },
  {
    path: `/databases/(default)/documents/users/${INTRUS}`,
    data: { householdId: null, email: 'intrus@example.com' }
  }
];

const auth = (uid) => (uid ? { uid, token: { sub: uid } } : null);

/**
 * @param {string} name        intitulé lisible du scénario
 * @param {'ALLOW'|'DENY'} expect  résultat attendu
 * @param {object} request     requête simulée
 * @param {Array}  [resources] documents supplémentaires visibles par les règles
 */
const t = (name, expect, request, resources = []) => ({ name, expect, request, resources });

const recipeA = {
  path: '/databases/(default)/documents/recipes/r1',
  data: { householdId: FOYER_A, name: 'Risotto' }
};
const mealPlanA = {
  path: '/databases/(default)/documents/mealPlans/mp1',
  data: { householdId: FOYER_A, meals: {} }
};
const templateA = {
  path: '/databases/(default)/documents/mealPlanTemplates/t1',
  data: { householdId: FOYER_A, name: 'Semaine type' }
};
const householdA = {
  path: `/databases/(default)/documents/households/${FOYER_A}`,
  data: { name: 'Chez A', members: [MEMBRE], createdBy: MEMBRE }
};

const CASES = [
  // ---- Les trois collections auparavant grandes ouvertes (S1) -------------
  t('mealPlans · membre lit son planning', 'ALLOW', {
    auth: auth(MEMBRE), path: mealPlanA.path, method: 'get'
  }, [mealPlanA]),

  t('mealPlans · étranger lit le planning d’un autre foyer', 'DENY', {
    auth: auth(AUTRE), path: mealPlanA.path, method: 'get'
  }, [mealPlanA]),

  t('mealPlans · étranger SUPPRIME le planning d’un autre foyer', 'DENY', {
    auth: auth(AUTRE), path: mealPlanA.path, method: 'delete'
  }, [mealPlanA]),

  t('mealPlans · membre met à jour son planning', 'ALLOW', {
    auth: auth(MEMBRE), path: mealPlanA.path, method: 'update'
  }, [mealPlanA]),

  t('mealPlanTemplates · étranger lit un modèle', 'DENY', {
    auth: auth(AUTRE), path: templateA.path, method: 'get'
  }, [templateA]),

  t('mealPlanTemplates · membre lit son modèle', 'ALLOW', {
    auth: auth(MEMBRE), path: templateA.path, method: 'get'
  }, [templateA]),

  t('permanentShoppingItems · membre lit sa liste', 'ALLOW', {
    auth: auth(MEMBRE),
    path: `/databases/(default)/documents/permanentShoppingItems/${FOYER_A}`,
    method: 'get'
  }),

  t('permanentShoppingItems · étranger lit la liste d’un autre foyer', 'DENY', {
    auth: auth(AUTRE),
    path: `/databases/(default)/documents/permanentShoppingItems/${FOYER_A}`,
    method: 'get'
  }),

  t('permanentShoppingItems · membre écrit même si le document n’existe pas', 'ALLOW', {
    auth: auth(MEMBRE),
    path: `/databases/(default)/documents/permanentShoppingItems/${FOYER_A}`,
    method: 'create'
  }),

  // ---- Prise de contrôle d'un foyer (S2) ---------------------------------
  t('households · un inconnu s’ajoute aux membres', 'DENY', {
    auth: auth(INTRUS),
    path: householdA.path,
    method: 'update',
    data: { name: 'Chez A', members: [MEMBRE, INTRUS], createdBy: MEMBRE }
  }, [householdA]),

  t('households · un inconnu renomme le foyer en s’ajoutant', 'DENY', {
    auth: auth(INTRUS),
    path: householdA.path,
    method: 'update',
    data: { name: 'Piraté', members: [MEMBRE, INTRUS], createdBy: MEMBRE }
  }, [householdA]),

  t('households · un membre renomme son foyer', 'ALLOW', {
    auth: auth(MEMBRE),
    path: householdA.path,
    method: 'update',
    data: { name: 'Nouveau nom', members: [MEMBRE], createdBy: MEMBRE }
  }, [householdA]),

  t('households · lecture unitaire (lien d’invitation)', 'ALLOW', {
    auth: auth(INTRUS), path: householdA.path, method: 'get'
  }, [householdA]),

  t('households · énumération de tous les foyers', 'DENY', {
    auth: auth(INTRUS),
    path: '/databases/(default)/documents/households/foyerA',
    method: 'list'
  }, [householdA]),

  // ---- Annuaire des utilisateurs (S3) ------------------------------------
  t('users · lecture de sa propre fiche', 'ALLOW', {
    auth: auth(MEMBRE),
    path: `/databases/(default)/documents/users/${MEMBRE}`,
    method: 'get'
  }),

  t('users · lecture de la fiche d’un autre', 'DENY', {
    auth: auth(INTRUS),
    path: `/databases/(default)/documents/users/${MEMBRE}`,
    method: 'get'
  }),

  // ---- Recettes et ingrédients : non-régression ---------------------------
  t('recipes · membre lit ses recettes', 'ALLOW', {
    auth: auth(MEMBRE), path: recipeA.path, method: 'get'
  }, [recipeA]),

  t('recipes · étranger lit les recettes d’un autre foyer', 'DENY', {
    auth: auth(AUTRE), path: recipeA.path, method: 'get'
  }, [recipeA]),

  t('recipes · membre crée une recette dans son foyer', 'ALLOW', {
    auth: auth(MEMBRE),
    path: '/databases/(default)/documents/recipes/r2',
    method: 'create',
    data: { householdId: FOYER_A, name: 'Curry' }
  }),

  t('recipes · membre crée une recette dans un autre foyer', 'DENY', {
    auth: auth(MEMBRE),
    path: '/databases/(default)/documents/recipes/r3',
    method: 'create',
    data: { householdId: FOYER_B, name: 'Curry' }
  }),

  t('ingredients · catalogue global lisible par tous', 'ALLOW', {
    auth: auth(MEMBRE),
    path: '/databases/(default)/documents/ingredients/i1',
    method: 'get'
  }, [{
    path: '/databases/(default)/documents/ingredients/i1',
    data: { householdId: 'global', name: 'Sel' }
  }]),

  // ---- Non authentifié ----------------------------------------------------
  t('anonyme · lecture d’une recette', 'DENY', {
    auth: null, path: recipeA.path, method: 'get'
  }, [recipeA])
];

// ---------------------------------------------------------------------------

/**
 * Les règles appellent `get()` sur users/{uid} pour résoudre le foyer. L'API
 * n'a pas accès à la base pendant l'évaluation : il faut lui fournir la
 * réponse de chaque appel sous forme de mock.
 */
const buildFunctionMocks = (resources) =>
  [...MOCK_DOCS, ...resources].map((doc) => ({
    function: 'get',
    args: [{ exactValue: doc.path }],
    result: { value: { data: doc.data } }
  }));

const buildTestCase = ({ expect, request, resources }) => {
  const { auth: reqAuth, path, method, data } = request;
  const existing = resources.find((r) => r.path === path);

  return {
    expectation: expect === 'ALLOW' ? 'ALLOW' : 'DENY',
    functionMocks: buildFunctionMocks(resources),
    request: {
      auth: reqAuth,
      path,
      method,
      time: new Date().toISOString(),
      ...(data ? { resource: { data } } : {})
    },
    ...(existing ? { resource: { data: existing.data } } : {})
  };
};

const run = async () => {
  const source = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
  const token = await credential.getAccessToken();

  const body = {
    source: { files: [{ name: 'firestore.rules', content: source }] },
    testSuite: {
      testCases: CASES.map(buildTestCase)
    }
  };

  const res = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}:test`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  const json = await res.json();

  if (json.error) {
    console.error('\nAPI Rules :', json.error.message);
    if (json.error.status === 'PERMISSION_DENIED') {
      console.error(
        '\nLe compte de service n’a pas le droit de tester des règles.\n' +
        'Accordez-lui le rôle « Firebase Rules Admin » :\n' +
        `  console.cloud.google.com/iam-admin/iam?project=${projectId}\n` +
        `  → ${serviceAccount.client_email} → roles/firebaserules.admin\n`
      );
    }
    process.exit(1);
  }

  if (json.issues?.length) {
    console.error('\nLe jeu de règles ne compile pas :\n');
    json.issues.forEach((i) =>
      console.error(`  ligne ${i.sourcePosition?.line} · ${i.description}`)
    );
    process.exit(1);
  }

  const results = json.testResults || [];
  let failed = 0;

  console.log('\nRègles Firestore — évaluation côté serveur\n');

  results.forEach((result, i) => {
    const c = CASES[i];
    const ok = result.state === 'SUCCESS';
    if (!ok) failed += 1;

    const mark = ok ? '\x1b[32m  ok  \x1b[0m' : '\x1b[31m ÉCHEC\x1b[0m';
    const want = c.expect === 'ALLOW' ? 'autorisé' : 'refusé';
    console.log(`${mark} ${c.name}  \x1b[2m→ ${want}\x1b[0m`);

    if (!ok && result.errorPosition) {
      console.log(`        \x1b[2mligne ${result.errorPosition.line}\x1b[0m`);
    }
  });

  console.log('');
  if (failed) {
    console.log(`\x1b[31m${failed} test(s) en échec sur ${results.length}.\x1b[0m\n`);
    process.exitCode = 1;
  } else {
    console.log(`\x1b[32m${results.length} tests passés. Le jeu de règles se comporte comme attendu.\x1b[0m\n`);
  }
};

run()
  // Le SDK admin garde un handle ouvert : on sort explicitement.
  .then(() => process.exit(process.exitCode || 0))
  .catch((e) => {
    console.error('\nÉchec :', e.message);
    process.exit(1);
  });

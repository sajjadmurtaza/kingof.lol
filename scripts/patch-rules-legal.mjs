/**
 * Adds rule7 + legal fine print to all non-EN locales.
 * Run: node scripts/patch-rules-legal.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const BASE = resolve(import.meta.dirname, "../src/i18n/locales");
const LOCALES = ["zh", "es", "ar", "hi", "fr", "de", "ja", "ko", "pt"];

const patches = {
  zh: {
    rule7: "不允许色情或成人网站。一经发现将立即移除，且不予退款。",
    legal1: "本规则可能随时变更。更新后继续使用即表示您接受修订后的条款。",
    legal2: "所有付款均为最终且不可退款，除非您所在地区的强制性法律另有要求。",
    legal3: "禁止色情或成人内容。违规列表将被下架且不予退款。",
    legal4:
      "我们处理运营 KINGOF 所需的信息（如邮箱、列表详情和使用情况）。您可联系我们查阅或删除您的个人数据。",
    legal5: "我们不保证任何排名、流量、收入或服务不间断可用。",
    legal6:
      "我们可自行决定移除、拒绝或修改任何列表。KINGOF 按现状提供；您须确保产品符合适用于您的法律。",
  },
  es: {
    rule7:
      "No se permiten sitios sexuales o para adultos. Si encontramos uno, se eliminará sin aviso ni reembolso.",
    legal1:
      "Estas reglas pueden cambiar en cualquier momento. Seguir usando KINGOF tras una actualización implica que aceptas los nuevos términos.",
    legal2:
      "Todos los pagos son finales y no reembolsables, salvo que la ley aplicable en tu caso exija lo contrario.",
    legal3:
      "El contenido sexual o para adultos está prohibido. Las fichas que lo incumplan se retirarán sin reembolso.",
    legal4:
      "Tratamos la información necesaria para operar KINGOF (correo, datos del listado, uso). Puedes solicitar acceso o eliminación de tus datos personales contactándonos.",
    legal5:
      "No garantizamos posición en el ranking, tráfico, ingresos ni disponibilidad ininterrumpida.",
    legal6:
      "Podemos eliminar, rechazar o modificar cualquier listado a nuestra discreción. KINGOF se ofrece tal cual; eres responsable de cumplir las leyes que te apliquen.",
  },
  ar: {
    rule7: "المواقع الجنسية أو للبالغين غير مسموحة. إذا وجدنا واحدة، سنزيلها دون إشعار أو استرداد.",
    legal1:
      "قد تتغير هذه القواعد في أي وقت. الاستمرار في الاستخدام بعد التحديث يعني قبولك للشروط المعدّلة.",
    legal2: "جميع المدفوعات نهائية وغير قابلة للاسترداد، إلا إذا فرض القانون المعمول به خلاف ذلك.",
    legal3: "المحتوى الجنسي أو للبالغين محظور. ستُزال القوائم المخالفة دون استرداد.",
    legal4:
      "نعالج المعلومات اللازمة لتشغيل KINGOF (مثل بريدك الإلكتروني وتفاصيل القائمة والاستخدام). يمكنك طلب الاطلاع على بياناتك الشخصية أو حذفها بالتواصل معنا.",
    legal5: "لا نضمن أي ترتيب أو زيارات أو إيرادات أو توفر دون انقطاع.",
    legal6:
      "يجوز لنا إزالة أو رفض أو تعديل أي قائمة وفق تقديرنا. يُقدَّم KINGOF كما هو؛ أنت مسؤول عن امتثال منتجك للقوانين التي تنطبق عليك.",
  },
  hi: {
    rule7: "यौन या वयस्क वेबसाइटें अनुमत नहीं हैं। मिलने पर बिना सूचना या रिफंड के हटा दी जाएंगी।",
    legal1:
      "ये नियम किसी भी समय बदल सकते हैं। अपडेट के बाद उपयोग जारी रखना संशोधित शर्तों की स्वीकृति माना जाएगा।",
    legal2:
      "सभी भुगतान अंतिम और अप्रतिदेय हैं, सिवाय जहाँ आप पर लागू अनिवार्य कानून अन्यथा तय करे।",
    legal3: "यौन या वयस्क सामग्री प्रतिबंधित है। उल्लंघन करने वाली सूचियाँ बिना रिफंड हटाई जाएंगी।",
    legal4:
      "हम KINGOF चलाने के लिए ज़रूरी जानकारी (ईमेल, लिस्टिंग विवरण, उपयोग) संसाधित करते हैं। आप हमसे संपर्क कर अपने व्यक्तिगत डेटा की पहुँच या हटाने का अनुरोध कर सकते हैं।",
    legal5: "हम रैंकिंग, ट्रैफ़िक, राजस्व या निर्बाध उपलब्धता की गारंटी नहीं देते।",
    legal6:
      "हम अपने विवेक से किसी भी सूची को हटा, अस्वीकार या बदल सकते हैं। KINGOF जैसा है वैसा प्रदान किया जाता है; आपके उत्पाद के लिए लागू कानूनों का पालन आपकी ज़िम्मेदारी है।",
  },
  fr: {
    rule7:
      "Les sites sexuels ou pour adultes ne sont pas autorisés. S’il y en a un, il sera retiré sans préavis ni remboursement.",
    legal1:
      "Ces règles peuvent changer à tout moment. Continuer à utiliser KINGOF après une mise à jour vaut acceptation des nouvelles conditions.",
    legal2:
      "Tous les paiements sont définitifs et non remboursables, sauf si la loi qui vous est applicable l’exige.",
    legal3:
      "Le contenu sexuel ou pour adultes est interdit. Les fiches en infraction seront retirées sans remboursement.",
    legal4:
      "Nous traitons les informations nécessaires au fonctionnement de KINGOF (e-mail, détails du listing, usage). Vous pouvez demander l’accès ou la suppression de vos données personnelles en nous contactant.",
    legal5: "Nous ne garantissons aucun classement, trafic, revenu ni disponibilité ininterrompue.",
    legal6:
      "Nous pouvons retirer, refuser ou modifier toute fiche à notre discrétion. KINGOF est fourni en l’état ; vous devez vous assurer que votre produit respecte les lois qui vous sont applicables.",
  },
  de: {
    rule7:
      "Sexuelle oder erwachsenenorientierte Websites sind nicht erlaubt. Werden sie gefunden, werden sie ohne Vorankündigung und ohne Erstattung entfernt.",
    legal1:
      "Diese Regeln können jederzeit geändert werden. Die weitere Nutzung nach einer Änderung gilt als Zustimmung zu den überarbeiteten Bedingungen.",
    legal2:
      "Alle Zahlungen sind endgültig und nicht erstattbar, soweit nicht zwingendes Recht etwas anderes vorschreibt.",
    legal3:
      "Sexuelle oder erwachsenenorientierte Inhalte sind verboten. Verstöße werden ohne Erstattung entfernt.",
    legal4:
      "Wir verarbeiten Informationen, die zum Betrieb von KINGOF nötig sind (z. B. E-Mail, Listing-Daten, Nutzung). Sie können bei uns Zugang zu oder Löschung Ihrer personenbezogenen Daten verlangen.",
    legal5:
      "Wir garantieren keine Ranking-Position, Klicks, Umsätze oder unterbrechungsfreien Betrieb.",
    legal6:
      "Wir können Einträge nach eigenem Ermessen entfernen, ablehnen oder ändern. KINGOF wird wie besehen bereitgestellt; Sie sind für die Einhaltung der auf Sie zutreffenden Gesetze verantwortlich.",
  },
  ja: {
    rule7: "性的またはアダルト向けのサイトは禁止です。発見次第、予告なく返金なしで削除します。",
    legal1:
      "本規則は随時変更される場合があります。更新後も利用を続けることで、改訂後の条件に同意したものとみなします。",
    legal2:
      "すべての支払いは最終的で返金不可です。お客様に適用される強行法規で別段の定めがある場合を除きます。",
    legal3: "性的またはアダルト向けコンテンツは禁止です。違反する掲載は返金なしで削除されます。",
    legal4:
      "KINGOFの運営に必要な情報（メール、掲載内容、利用状況など）を処理します。お問い合わせにより、個人データの開示または削除を請求できます。",
    legal5: "ランキング、トラフィック、収益、または中断のない提供を保証しません。",
    legal6:
      "当社の裁量で掲載を削除・拒否・変更することがあります。KINGOFは現状有姿で提供されます。お客様の製品が適用される法令に準拠していることはお客様の責任です。",
  },
  ko: {
    rule7: "성인 또는 음란 사이트는 허용되지 않습니다. 발견 시 사전 통지나 환불 없이 제거됩니다.",
    legal1:
      "본 규칙은 언제든 변경될 수 있습니다. 업데이트 후에도 계속 이용하면 개정된 약관에 동의한 것으로 봅니다.",
    legal2:
      "모든 결제는 최종적이며 환불되지 않습니다. 귀하에게 적용되는 강행 법률이 달리 정하는 경우는 제외합니다.",
    legal3: "성인 또는 음란 콘텐츠는 금지됩니다. 위반 리스팅은 환불 없이 삭제됩니다.",
    legal4:
      "KINGOF 운영에 필요한 정보(이메일, 리스팅 정보, 이용 데이터 등)를 처리합니다. 문의를 통해 개인정보 열람 또는 삭제를 요청할 수 있습니다.",
    legal5: "순위, 트래픽, 수익 또는 중단 없는 서비스를 보장하지 않습니다.",
    legal6:
      "당사는 재량으로 리스팅을 삭제·거부·변경할 수 있습니다. KINGOF는 있는 그대로 제공되며, 귀하의 제품이 적용 법률을 준수하는 것은 귀하의 책임입니다.",
  },
  pt: {
    rule7:
      "Sites sexuais ou para adultos não são permitidos. Se encontrarmos um, será removido sem aviso nem reembolso.",
    legal1:
      "Estas regras podem mudar a qualquer momento. Continuar a usar o KINGOF após uma atualização significa que aceita os termos revisados.",
    legal2:
      "Todos os pagamentos são finais e não reembolsáveis, exceto quando a lei aplicável a si exigir o contrário.",
    legal3:
      "Conteúdo sexual ou para adultos é proibido. Listagens em violação serão retiradas sem reembolso.",
    legal4:
      "Processamos informações necessárias para operar o KINGOF (e-mail, detalhes do anúncio, uso). Pode solicitar acesso ou eliminação dos seus dados pessoais contactando-nos.",
    legal5: "Não garantimos posição no ranking, tráfego, receita ou disponibilidade ininterrupta.",
    legal6:
      "Podemos remover, rejeitar ou alterar qualquer listagem a nosso critério. O KINGOF é fornecido como está; é sua responsabilidade garantir que o seu produto cumpre as leis que lhe são aplicáveis.",
  },
};

for (const locale of LOCALES) {
  const path = join(BASE, locale, "app.json");
  const data = JSON.parse(readFileSync(path, "utf-8"));
  Object.assign(data.rules, patches[locale]);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Patched ${locale}/rules`);
}

console.log("Done.");

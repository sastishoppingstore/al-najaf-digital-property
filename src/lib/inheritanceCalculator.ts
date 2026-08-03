export type Fiqh = 'hanafi' | 'jafria';

export interface InheritanceInput {
  cash?: number;
  landArea?: number;
  landUnit?: string;
  deceasedGender?: 'male' | 'female';
  wivesCount?: number;
  husbandAlive?: boolean;
  sons?: number;
  daughters?: number;
  fatherAlive?: boolean;
  motherAlive?: boolean;
  fiqh?: Fiqh;
}

export interface Share {
  heir: string;
  fraction: string;
  fractionNum: number;
  cash: number;
  land: number;
}

export interface InheritanceResult {
  shares: Share[];
  awlApplied: boolean;
  totalFraction: number;
  note: string | null;
  landUnit: string;
  fiqh: Fiqh;
}

/**
 * Islamic (Wirasat) inheritance calculator.
 *
 * - Fiqh-e-Hanafi (Ahl-e-Sunnat): Quranic fixed shares (4:11-12, 4:176) with
 *   residuary (asaba) system and 'Awl when fixed shares exceed the estate.
 * - Fiqh-e-Jafria (Ahl-e-Tashi): fixed shares plus radd/reversion to Class-1
 *   heirs (walidain + aulad); wife does NOT inherit land (immovable property).
 *
 * Scope: simple/common cases only (spouse, parents, sons, daughters).
 * Complex structures (dada-dadi, bhai-behnein, multiple wives + edge cases)
 * must be referred to a qualified Mufti / Aalim or legal advisor.
 */
export function calculateInheritance(input: InheritanceInput = {}): InheritanceResult {
  const {
    cash = 0, landArea = 0, landUnit = 'Marla',
    deceasedGender = 'male', wivesCount = 0, husbandAlive = false,
    sons = 0, daughters = 0, fatherAlive = false, motherAlive = false,
    fiqh = 'hanafi',
  } = input;

  const hasChildren = sons + daughters > 0;
  const shares: Share[] = [];
  let awlApplied = false;
  let note: string | null = null;

  const isWife = deceasedGender === 'male' && wivesCount > 0;
  const isHusband = deceasedGender === 'female' && husbandAlive;

  // ── STEP 1: Spouse share ──
  let spouseFrac = 0;
  if (isWife) spouseFrac = hasChildren ? 1 / 8 : 1 / 4;
  else if (isHusband) spouseFrac = hasChildren ? 1 / 4 : 1 / 2;

  if (isWife) {
    shares.push({
      heir: wivesCount === 1 ? 'Wife (بیوی)' : `Wives ×${wivesCount} (بیویاں ×${wivesCount})`,
      fraction: formatFraction(spouseFrac),
      fractionNum: spouseFrac,
      cash: Math.round(cash * spouseFrac),
      land: roundLand(landArea * spouseFrac),
    });
  } else if (isHusband) {
    shares.push({
      heir: 'Husband (شوہر)',
      fraction: formatFraction(spouseFrac),
      fractionNum: spouseFrac,
      cash: Math.round(cash * spouseFrac),
      land: roundLand(landArea * spouseFrac),
    });
  }

  // ── STEP 2: Parents' shares ──
  let motherFrac = 0;
  if (motherAlive) {
    motherFrac = hasChildren ? 1 / 6 : (1 / 3) * Math.max(0, 1 - spouseFrac);
    shares.push({
      heir: 'Mother (والدہ)',
      fraction: formatFraction(motherFrac),
      fractionNum: motherFrac,
      cash: Math.round(cash * motherFrac),
      land: roundLand(landArea * motherFrac),
    });
  }

  let fatherFrac = 0;
  if (fatherAlive) {
    if (hasChildren) fatherFrac = 1 / 6;
    shares.push({
      heir: 'Father (والد)',
      fraction: formatFraction(fatherFrac),
      fractionNum: fatherFrac,
      cash: Math.round(cash * fatherFrac),
      land: roundLand(landArea * fatherFrac),
    });
  }

  // ── STEP 3: Daughters' fixed share (when no son) ──
  let daughterFixedFrac = 0;
  let daughterIndex = -1;
  if (sons === 0 && daughters > 0) {
    daughterFixedFrac = daughters === 1 ? 1 / 2 : 2 / 3;
    daughterIndex = shares.length;
    shares.push({
      heir: daughters === 1 ? 'Daughter (بیٹی)' : `Daughters ×${daughters} (بیٹیاں ×${daughters})`,
      fraction: formatFraction(daughterFixedFrac),
      fractionNum: daughterFixedFrac,
      cash: Math.round(cash * daughterFixedFrac),
      land: roundLand(landArea * daughterFixedFrac),
    });
  }

  // ── STEP 4: 'Awl / adjustment when fixed shares exceed the estate ──
  let totalFixed = spouseFrac + motherFrac + fatherFrac + daughterFixedFrac;
  if (totalFixed > 1) {
    awlApplied = true;
    const factor = 1 / totalFixed;
    for (const sh of shares) {
      sh.fractionNum *= factor;
      sh.fraction = formatFraction(sh.fractionNum);
      sh.cash = Math.round(cash * sh.fractionNum);
      sh.land = roundLand(landArea * sh.fractionNum);
    }
    motherFrac *= factor;
    fatherFrac *= factor;
    daughterFixedFrac *= factor;
    spouseFrac *= factor;
    totalFixed = 1;
  }

  const remainingAfterFixed = Math.max(0, 1 - totalFixed);

  // ── STEP 5: Residuary / reversion allocation ──
  if (fiqh === 'hanafi') {
    // 5a. Father residuary when no sons
    if (fatherAlive && sons === 0 && remainingAfterFixed > 0) {
      const fatherEntry = shares.find((s) => s.heir.startsWith('Father'));
      if (fatherEntry) {
        fatherEntry.fractionNum += remainingAfterFixed;
        fatherEntry.fraction = formatFraction(fatherEntry.fractionNum);
        fatherEntry.cash = Math.round(cash * fatherEntry.fractionNum);
        fatherEntry.land = roundLand(landArea * fatherEntry.fractionNum);
      }
    }

    // 5b. Sons (and daughters with sons) — residuary after fixed shares
    if (sons > 0) {
      const fixedForChildren = spouseFrac + motherFrac + fatherFrac;
      const childResiduary = Math.max(0, 1 - fixedForChildren);
      if (childResiduary > 0) {
        const totalSonParts = sons * 2 + daughters * 1;
        const perSon = (childResiduary * 2) / totalSonParts;
        const perDaughter = childResiduary / totalSonParts;
        shares.push({
          heir: sons === 1 ? 'Son (بیٹا)' : `Sons ×${sons} (بیٹے ×${sons})`,
          fraction: `${formatFraction(perSon)} each`,
          fractionNum: perSon * sons,
          cash: Math.round(cash * perSon * sons),
          land: roundLand(landArea * perSon * sons),
        });
        if (daughters > 0) {
          shares.push({
            heir: daughters === 1 ? 'Daughter (بیٹی)' : `Daughters ×${daughters} (بیٹیاں ×${daughters})`,
            fraction: `${formatFraction(perDaughter)} each`,
            fractionNum: perDaughter * daughters,
            cash: Math.round(cash * perDaughter * daughters),
            land: roundLand(landArea * perDaughter * daughters),
          });
        }
      }
    }

    // 5c. Remnant reverts to other agnate heirs (not covered) when no son/father
    if (sons === 0 && daughters > 0 && !fatherAlive) {
      const distributed = shares.reduce((s, sh) => s + sh.fractionNum, 0);
      const leftover = Math.max(0, 1 - distributed);
      if (leftover > 0.001) {
        note = "Remaining estate reverts to other Shar'i heirs (agnates) not covered by this calculator — consult a scholar/Islamic legal expert.";
      }
    }
  } else {
    // ── Fiqh-e-Jafria ──
    if (sons > 0) {
      // After fixed shares, the remainder goes to sons & daughters at 2:1
      const fixedForChildren = spouseFrac + motherFrac + fatherFrac;
      const childResiduary = Math.max(0, 1 - fixedForChildren);
      if (childResiduary > 0) {
        const totalSonParts = sons * 2 + daughters * 1;
        const perSon = (childResiduary * 2) / totalSonParts;
        const perDaughter = childResiduary / totalSonParts;
        shares.push({
          heir: sons === 1 ? 'Son (بیٹا)' : `Sons ×${sons} (بیٹے ×${sons})`,
          fraction: `${formatFraction(perSon)} each`,
          fractionNum: perSon * sons,
          cash: Math.round(cash * perSon * sons),
          land: roundLand(landArea * perSon * sons),
        });
        if (daughters > 0) {
          shares.push({
            heir: daughters === 1 ? 'Daughter (بیٹی)' : `Daughters ×${daughters} (بیٹیاں ×${daughters})`,
            fraction: `${formatFraction(perDaughter)} each`,
            fractionNum: perDaughter * daughters,
            cash: Math.round(cash * perDaughter * daughters),
            land: roundLand(landArea * perDaughter * daughters),
          });
        }
      }
    } else if (daughters > 0) {
      // Single daughter takes 1/2 + radd; multiple daughters 2/3 + radd (if no father)
      const fixedForOthers = spouseFrac + motherFrac + fatherFrac;
      const residue = Math.max(0, 1 - fixedForOthers - daughterFixedFrac);
      if (fatherAlive) {
        const fatherEntry = shares.find((s) => s.heir.startsWith('Father'));
        if (fatherEntry && residue > 0) {
          fatherEntry.fractionNum += residue;
          fatherEntry.fraction = formatFraction(fatherEntry.fractionNum);
          fatherEntry.cash = Math.round(cash * fatherEntry.fractionNum);
          fatherEntry.land = roundLand(landArea * fatherEntry.fractionNum);
        }
      } else if (residue > 0 && daughterIndex >= 0) {
        const dEntry = shares[daughterIndex];
        dEntry.fractionNum += residue;
        dEntry.fraction = formatFraction(dEntry.fractionNum) + (daughters === 1 ? ' (1/2 + radd)' : ' (+radd)');
        dEntry.cash = Math.round(cash * dEntry.fractionNum);
        dEntry.land = roundLand(landArea * dEntry.fractionNum);
      }
    } else if (fatherAlive) {
      // No children — father is residuary after spouse & mother
      const residue = Math.max(0, 1 - spouseFrac - motherFrac);
      const fatherEntry = shares.find((s) => s.heir.startsWith('Father'));
      if (fatherEntry && residue > 0) {
        fatherEntry.fractionNum += residue;
        fatherEntry.fraction = formatFraction(fatherEntry.fractionNum);
        fatherEntry.cash = Math.round(cash * fatherEntry.fractionNum);
        fatherEntry.land = roundLand(landArea * fatherEntry.fractionNum);
      }
    }

    // Jafria: wife does NOT inherit land (immovable property) —
    // she only receives her share from movable wealth (cash) and the value of
    // buildings/trees on the land. Land is re-distributed among the other heirs.
    if (isWife) {
      const wifeEntry = shares.find((s) => s.heir.startsWith('Wife') || s.heir.startsWith('Wives'));
      if (wifeEntry) {
        wifeEntry.land = 0;
        const others = shares.filter((s) => s !== wifeEntry);
        const sumOthers = others.reduce((s, sh) => s + sh.fractionNum, 0);
        if (sumOthers > 0) {
          for (const o of others) {
            o.land = roundLand(landArea * (o.fractionNum / sumOthers));
          }
        }
        note = "Fiqh-e-Jafria ke mutabiq biwi zameen (jaidad) ki waris nahi banti — usay sirf manqoola maal (cash) aur zameen par mojood imaraat/darakhton ki qeemat se hissa milta hai. Zameen baqi warisan ke darmiyan taqseem hoti hai.";
      }
    }

    if (!note) {
      note = "Fiqh-e-Jafria mein warisan 'tabqat' (classes) mein taqseem hote hain — agar Class 1 (walidain + aulad) mojood ho to baqi classes khatam ho jati hain. Yeh calculator sirf aam cases ke liye hai; dada/dadi, bhai-behnein aur complex cases ke liye mufti/aalim se rabta karein.";
    }
  }

  const totalFraction = Math.round(shares.reduce((s, sh) => s + sh.fractionNum, 0) * 10000) / 10000;

  return {
    shares,
    awlApplied,
    totalFraction,
    note,
    landUnit,
    fiqh,
  };
}

function formatFraction(num: number): string {
  if (Math.abs(num) < 0.0001) return '0';
  const common: [number, string][] = [
    [1 / 2, '1/2'], [1 / 3, '1/3'], [1 / 4, '1/4'], [1 / 6, '1/6'],
    [1 / 8, '1/8'], [2 / 3, '2/3'], [1, '1'],
    [1 / 12, '1/12'], [3 / 4, '3/4'],
  ];
  for (const [val, str] of common) {
    if (Math.abs(num - val) < 0.0001) return str;
  }
  return `≈${(Math.round(num * 10000) / 10000).toFixed(4)}`;
}

function roundLand(area: number): number {
  return Math.round(area * 100) / 100;
}

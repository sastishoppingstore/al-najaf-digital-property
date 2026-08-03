<?php
/**
 * Punjab Registry Expenses Calculator
 * Calculates various registry fees based on DC Rate and user selections
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// ============================================================
// CONFIGURABLE RATES / FEES - Easy to update for government changes
// ============================================================

// Stamp Duty Configuration
$STAMP_DUTY_PERCENTAGE = 3.5;  // Percentage of DC Value

// Registration Fee Configuration (flat amounts based on DC value)
$REG_FEE_BELOW_500K = 2500;   // Flat fee for DC Value below Rs. 500,000
$REG_FEE_ABOVE_500K = 3500;   // Flat fee for DC Value above Rs. 500,000

// Local Body / Committee Fee percentages
$LOCAL_BODY_DISTRICT = 1.5;       // District/Committee
$LOCAL_BODY_MUNICIPAL = 2.5;     // Municipal Corporation
$LOCAL_BODY_CANTONMENT = 2.0;    // Cantonment Board

// Comparison Fee (flat)
$COMPARISON_FEE = 500;

// Mutation Fees (flat)
$MUTATION_FEE = 1000;

// PLRA Fee percentage
$PLRA_FEE_PERCENTAGE = 0.5;  // 0.5% of DC Value

// FBR 236-K Tax - Buyer Status percentages
$BUYER_FILER = 1.0;        // Filer
$BUYER_LATE_FILER = 1.5;   // Late Filer
$BUYER_NON_FILER = 2.0;    // Non-Filer

// FBR 236-C Tax - Seller Status percentages
$SELLER_FILER = 1.0;       // Filer
$SELLER_LATE_FILER = 1.5;  // Late Filer
$SELLER_NON_FILER = 2.0;   // Non-Filer

// Map/Non-Approval Fee
$MAP_APPROVED = 0;      // Approved property
$MAP_NOT_APPROVED = 2.0; // Not Approved (2% of DC Value)

// Miscellaneous Charges (flat)
$MISCELLANEOUS_CHARGE = 500;

// Threshold for registration fee
$REG_FEE_THRESHOLD = 500000;

// ============================================================
// HELPER FUNCTION TO FORMAT AMOUNT
// ============================================================
function formatAmount($amount) {
    return number_format($amount, 2, '.', ',');
}

// ============================================================
// GET INPUT FROM REQUEST
// ============================================================
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['error' => 'Invalid input data']);
    exit;
}

// Validate DC Rate
$dcRate = isset($input['dcRate']) ? floatval($input['dcRate']) : 0;

if ($dcRate <= 0) {
    echo json_encode(['error' => 'Invalid DC Rate']);
    exit;
}

// Get buyer status
$buyerStatus = isset($input['buyerStatus']) ? trim($input['buyerStatus']) : 'Filer';
$buyerPercentage = 0;
switch ($buyerStatus) {
    case 'Late Filer':
        $buyerPercentage = $BUYER_LATE_FILER;
        break;
    case 'Non-Filer':
        $buyerPercentage = $BUYER_NON_FILER;
        break;
    case 'Filer':
    default:
        $buyerPercentage = $BUYER_FILER;
        break;
}

// Get seller status
$sellerStatus = isset($input['sellerStatus']) ? trim($input['sellerStatus']) : 'Filer';
$sellerPercentage = 0;
switch ($sellerStatus) {
    case 'Late Filer':
        $sellerPercentage = $SELLER_LATE_FILER;
        break;
    case 'Non-Filer':
        $sellerPercentage = $SELLER_NON_FILER;
        break;
    case 'Filer':
    default:
        $sellerPercentage = $SELLER_FILER;
        break;
}

// Get local body type
$localBody = isset($input['localBody']) ? trim($input['localBody']) : 'District/Committee';
$localBodyPercentage = 0;
switch ($localBody) {
    case 'Municipal Corporation':
        $localBodyPercentage = $LOCAL_BODY_MUNICIPAL;
        break;
    case 'Cantonment Board':
        $localBodyPercentage = $LOCAL_BODY_CANTONMENT;
        break;
    case 'District/Committee':
    default:
        $localBodyPercentage = $LOCAL_BODY_DISTRICT;
        break;
}

// Get property map type
$mapType = isset($input['mapType']) ? trim($input['mapType']) : 'Approved';
$mapPercentage = ($mapType === 'Not Approved') ? $MAP_NOT_APPROVED : $MAP_APPROVED;

// ============================================================
// CALCULATIONS
// ============================================================

// 1. Stamp Duty (% of DC value)
$stampDuty = $dcRate * ($STAMP_DUTY_PERCENTAGE / 100);

// 2. Registration Fee (flat, tiered)
$registrationFee = ($dcRate < $REG_FEE_THRESHOLD) ? $REG_FEE_BELOW_500K : $REG_FEE_ABOVE_500K;

// 3. Local Body / Committee Fee (% of DC value)
$localBodyFee = $dcRate * ($localBodyPercentage / 100);

// 4. Comparison Fee (flat)
$comparisonFee = $COMPARISON_FEE;

// 5. Mutation Fees (flat)
$mutationFee = $MUTATION_FEE;

// 6. PLRA Fee (% of DC value)
$plraFee = $dcRate * ($PLRA_FEE_PERCENTAGE / 100);

// 7. Advance Tax 236-K - Buyer (% of DC value)
$advanceTax236K = $dcRate * ($buyerPercentage / 100);

// 8. Gain Tax 236-C - Seller (% of DC value)
$gainTax236C = $dcRate * ($sellerPercentage / 100);

// 9. Map Non-Approval Fee (% of DC value)
$mapNonApprovalFee = $dcRate * ($mapPercentage / 100);

// 10. Miscellaneous Charges (flat)
$miscellaneousCharge = $MISCELLANEOUS_CHARGE;

// Grand Total
$grandTotal = $stampDuty + $registrationFee + $localBodyFee + $comparisonFee + 
               $mutationFee + $plraFee + $advanceTax236K + $gainTax236C + 
               $mapNonApprovalFee + $miscellaneousCharge;

// ============================================================
// RETURN JSON RESPONSE
// ============================================================
$response = [
    'success' => true,
    'dcRate' => $dcRate,
    'calculations' => [
        [
            'expenseType' => 'Stamp Duty',
            'rateRule' => $STAMP_DUTY_PERCENTAGE . '% of DC Value',
            'amount' => formatAmount($stampDuty)
        ],
        [
            'expenseType' => 'Registration Fee',
            'rateRule' => ($dcRate < $REG_FEE_THRESHOLD) 
                ? 'Flat: Rs. ' . number_format($REG_FEE_BELOW_500K) . ' (DC < Rs. 500,000)' 
                : 'Flat: Rs. ' . number_format($REG_FEE_ABOVE_500K) . ' (DC >= Rs. 500,000)',
            'amount' => formatAmount($registrationFee)
        ],
        [
            'expenseType' => 'Local Body / Committee Fee',
            'rateRule' => $localBodyPercentage . '% of DC Value (' . $localBody . ')',
            'amount' => formatAmount($localBodyFee)
        ],
        [
            'expenseType' => 'Comparison Fee',
            'rateRule' => 'Flat: Rs. ' . number_format($COMPARISON_FEE),
            'amount' => formatAmount($comparisonFee)
        ],
        [
            'expenseType' => 'Mutation Fees',
            'rateRule' => 'Flat: Rs. ' . number_format($MUTATION_FEE),
            'amount' => formatAmount($mutationFee)
        ],
        [
            'expenseType' => 'PLRA Fee',
            'rateRule' => $PLRA_FEE_PERCENTAGE . '% of DC Value',
            'amount' => formatAmount($plraFee)
        ],
        [
            'expenseType' => 'Advance Tax 236-K (Buyer)',
            'rateRule' => $buyerPercentage . '% of DC Value (' . $buyerStatus . ')',
            'amount' => formatAmount($advanceTax236K)
        ],
        [
            'expenseType' => 'Gain Tax 236-C (Seller)',
            'rateRule' => $sellerPercentage . '% of DC Value (' . $sellerStatus . ')',
            'amount' => formatAmount($gainTax236C)
        ],
        [
            'expenseType' => 'Map Non-Approval Fee',
            'rateRule' => $mapPercentage . '% of DC Value (' . $mapType . ')',
            'amount' => formatAmount($mapNonApprovalFee)
        ],
        [
            'expenseType' => 'Miscellaneous Charges',
            'rateRule' => 'Flat: Rs. ' . number_format($MISCELLANEOUS_CHARGE),
            'amount' => formatAmount($miscellaneousCharge)
        ],
    ],
    'grandTotal' => formatAmount($grandTotal),
    'inputs' => [
        'buyerStatus' => $buyerStatus,
        'sellerStatus' => $sellerStatus,
        'localBody' => $localBody,
        'mapType' => $mapType
    ]
];

echo json_encode($response);
?>
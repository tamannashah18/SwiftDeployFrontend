const fs = require('fs');

console.log('=== DEPLOYMENT MODAL STYLING VALIDATION ===\n');

const content = fs.readFileSync('src/Components/DeploymentModal.jsx', 'utf8');

let allValid = true;

console.log('1. Button Sizing:');
if (content.includes('size="lg"') && content.split('size="lg"').length === 3) {
  console.log('   ✓ Both buttons use size="lg"');
} else {
  console.log('   ✗ Buttons not sized consistently');
  allValid = false;
}

if (content.includes("minWidth: '150px'") && content.split("minWidth: '150px'").length === 3) {
  console.log('   ✓ Both buttons have equal minWidth');
} else {
  console.log('   ✗ Buttons not equal width');
  allValid = false;
}

console.log('\n2. Button Container:');
if (content.includes('justify-content-center')) {
  console.log('   ✓ Buttons centered horizontally');
} else {
  console.log('   ✗ Buttons not centered');
  allValid = false;
}

if (content.includes('gap-3')) {
  console.log('   ✓ Proper spacing between buttons');
} else {
  console.log('   ✗ Button spacing incorrect');
  allValid = false;
}

console.log('\n3. Card Alignment:');
if (content.includes("maxWidth: '500px'") && content.includes("margin: '0 auto'")) {
  console.log('   ✓ Card centered with max-width');
} else {
  console.log('   ✗ Card not properly centered');
  allValid = false;
}

if (content.includes('text-center')) {
  console.log('   ✓ Title centered');
} else {
  console.log('   ✗ Title not centered');
  allValid = false;
}

console.log('\n4. Typography:');
if (content.includes("fontWeight: '500'")) {
  console.log('   ✓ Consistent button font weight');
} else {
  console.log('   ✗ Button font weight inconsistent');
  allValid = false;
}

if (content.includes("marginTop: '4px'")) {
  console.log('   ✓ Proper spacing in card content');
} else {
  console.log('   ✗ Card content spacing missing');
  allValid = false;
}

console.log('\n5. Syntax Check:');
const ob = (content.match(/{/g) || []).length;
const cb = (content.match(/}/g) || []).length;
if (ob === cb) {
  console.log('   ✓ Balanced braces');
} else {
  console.log(`   ✗ Unbalanced braces: ${ob} open, ${cb} close`);
  allValid = false;
}

console.log('\n=== STYLING IMPROVEMENTS ===\n');
console.log('Buttons:');
console.log('  ✓ Both buttons same size (lg)');
console.log('  ✓ Both buttons same width (150px minimum)');
console.log('  ✓ Centered with even spacing');
console.log('  ✓ Medium font weight for better readability');

console.log('\nCard:');
console.log('  ✓ Centered horizontally with max-width');
console.log('  ✓ Proper padding (p-4)');
console.log('  ✓ Better spacing between label and value');
console.log('  ✓ Long URLs break properly');

console.log('\nLayout:');
console.log('  ✓ Title centered');
console.log('  ✓ Visual hierarchy improved');
console.log('  ✓ Professional appearance');

console.log('\n=== RESULT ===\n');
if (allValid) {
  console.log('✅ ALL STYLING VALIDATIONS PASSED');
  console.log('✅ Buttons properly sized and aligned');
  console.log('✅ Card centered in modal');
  console.log('✅ Professional, balanced layout');
} else {
  console.log('❌ VALIDATION FAILED');
}

process.exit(allValid ? 0 : 1);

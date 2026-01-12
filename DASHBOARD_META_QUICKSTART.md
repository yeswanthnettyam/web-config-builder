# Dashboard Metadata - Quick Start Guide

## 🚀 5-Minute Guide to Dashboard Tile Configuration

### What is Dashboard Metadata?

Dashboard Metadata lets you configure how flow tiles look on the Home/Dashboard screen - **without touching mobile app code**.

---

## 📍 Where to Find It

1. Go to **Flow Builder** → **New Flow** (or **Edit Flow**)
2. Look for the **"Dashboard Appearance"** section
3. It's between "Basic Information" and "Flow Diagram"

---

## 🎨 What You Can Configure

| Field | Purpose | Example |
|-------|---------|---------|
| **Tile Title** | Main heading | "Applicant Onboarding" |
| **Tile Description** | Brief description | "Capture applicant details" |
| **Dashboard Icon** | Icon displayed | 👤 Applicant Onboarding |
| **Background Color** | Tile background | `#0B2F70` (Blue) |
| **Text Color** | Title & description text | `#FFFFFF` (White) |
| **Icon Color** | Icon tint color | `#00B2FF` (Light Blue) |

---

## 🎯 Step-by-Step Usage

### Creating a New Flow with Dashboard Metadata

```
1. Fill in "Flow ID" and "Scope" (Basic Information)
2. Scroll to "Dashboard Appearance"
3. Fill in:
   ✅ Tile Title: "Applicant Onboarding"
   ✅ Tile Description: "Capture applicant personal details"
   ✅ Dashboard Icon: Select "👤 Applicant Onboarding"
   ✅ Background Color: "#0B2F70"
   ✅ Text Color: "#FFFFFF"
   ✅ Icon Color: "#00B2FF"
4. See live preview at the bottom
5. Build your flow in "Flow Diagram" section
6. Click "Save Flow"
```

### Editing Existing Flow

```
1. Go to Flow Builder list
2. Click "Edit" on any flow
3. Dashboard Appearance section shows existing values (if configured)
4. Modify any field
5. Click "Save Flow"
```

### Leave It Empty?

**Yes, it's optional!** If you don't fill in Dashboard Appearance:
- ✅ Flow still works perfectly
- ✅ Dashboard will use default colors
- ✅ Flow ID will be used as title

---

## 🎨 Color Tips

### Good Color Combinations

**Professional Blue:**
```
Background: #0B2F70 (Dark Blue)
Text:       #FFFFFF (White)
Icon:       #00B2FF (Light Blue)
```

**Success Green:**
```
Background: #2E7D32 (Dark Green)
Text:       #FFFFFF (White)
Icon:       #81C784 (Light Green)
```

**Warning Orange:**
```
Background: #E65100 (Dark Orange)
Text:       #FFFFFF (White)
Icon:       #FFB74D (Light Orange)
```

**Error Red:**
```
Background: #C62828 (Dark Red)
Text:       #FFFFFF (White)
Icon:       #FF6F00 (Orange)
```

### HEX Color Format

✅ Valid:
- `#0B2F70` (6-digit HEX)
- `#FFF` (3-digit HEX)
- `#00B2FF` (with uppercase letters)
- `#00b2ff` (with lowercase letters)

❌ Invalid:
- `0B2F70` (missing #)
- `#0B2F7` (wrong length)
- `blue` (color name not allowed)
- `rgb(11, 47, 112)` (RGB format not allowed)

---

## 🖼️ Available Icons

| Icon Key | Display | Best For |
|----------|---------|----------|
| `APPLICANT_ONBOARDING` | 👤 | Personal details, KYC |
| `CREDIT_CHECK` | 💳 | Credit bureau, score |
| `GROUP_CREATION` | 👥 | Group formation |
| `KYC` | 🔍 | Identity verification |
| `FIELD_VERIFICATION` | 📍 | On-site checks |
| `ELIGIBILITY` | ✅ | Eligibility assessment |
| `DOCUMENT_SIGNING` | 📝 | E-signature, agreements |
| `PAYMENT` | 💰 | Payment, disbursement |
| `LOAN_APPLICATION` | 📄 | Loan forms |
| `BUSINESS_DETAILS` | 🏢 | Business info |
| `FINANCIAL_INFO` | 📊 | Financial data |
| `PHOTO_CAPTURE` | 📸 | Photo upload |
| `LOCATION` | 🗺️ | GPS, location |
| `AGREEMENT` | 📋 | Terms & conditions |
| `COMPLETION` | 🎉 | Flow completion |

---

## ✅ Best Practices

### Do's ✅

- **Use descriptive titles**: "Applicant Onboarding" not "Flow 1"
- **Keep descriptions short**: 1-2 sentences max
- **Choose meaningful icons**: Match icon to flow purpose
- **Test color contrast**: Ensure text is readable
- **Be consistent**: Use similar colors for related flows

### Don'ts ❌

- **Don't use technical IDs**: "PL_FLOW_001" → Use "Personal Loan Application"
- **Don't write long descriptions**: Keep it under 60 characters
- **Don't use poor contrast**: Yellow text on white background
- **Don't mix styles**: Keep consistent color schemes

---

## 🔍 Live Preview

The **Live Preview** at the bottom of the Dashboard Appearance section shows:

- ✅ How the tile will look
- ✅ Icon color and emoji
- ✅ Title with text color
- ✅ Description with text color
- ✅ Background color

**Tip**: Adjust colors until the preview looks good!

---

## ❓ Common Questions

### Q: Is Dashboard Appearance required?
**A:** No, it's completely optional. Flows work fine without it.

### Q: Can I change it later?
**A:** Yes! Edit the flow and update Dashboard Appearance anytime.

### Q: What if I leave colors empty?
**A:** Default brand colors will be used (#0B2F70 background, #FFFFFF text).

### Q: Can I use custom icons?
**A:** Not yet. Choose from the 15 predefined icons.

### Q: Does this affect flow logic?
**A:** No! Dashboard Appearance is **UI-only**. It doesn't change navigation or conditions.

### Q: Will old flows break?
**A:** No! Flows without Dashboard Appearance continue to work perfectly.

---

## 🐛 Troubleshooting

### Error: "Invalid HEX color format"

**Solution**: Ensure color starts with `#` and has 3 or 6 characters.
- ❌ `0B2F70` → ✅ `#0B2F70`

### Tile not showing custom colors in mobile app

**Solution**: Mobile team needs to implement dashboard renderer using metadata.

### Changes not saving

**Solution**: Check that all required flow fields are filled (Flow ID, Scope, Start Screen).

---

## 📚 Examples

### Example 1: Applicant Flow

```
Title:       "Applicant and Co-Applicant Onboarding"
Description: "Capture applicant personal and business details"
Icon:        👤 Applicant Onboarding
Background:  #0B2F70
Text:        #FFFFFF
Icon Color:  #00B2FF
```

### Example 2: Credit Check Flow

```
Title:       "Credit Verification"
Description: "Perform credit bureau checks and score evaluation"
Icon:        💳 Credit Check
Background:  #2E7D32
Text:        #FFFFFF
Icon Color:  #81C784
```

### Example 3: Document Signing Flow

```
Title:       "Document Signing"
Description: "Review and sign loan agreement documents"
Icon:        📝 Document Signing
Background:  #C62828
Text:        #FFFFFF
Icon Color:  #FF6F00
```

---

## 🎉 That's It!

You now know how to:
- ✅ Configure dashboard tile appearance
- ✅ Choose icons and colors
- ✅ Use the live preview
- ✅ Follow best practices

**Happy configuring!** 🚀

---

## 📞 Need Help?

- **Technical Guide**: See `DASHBOARD_META_GUIDE.md`
- **Summary**: See `DASHBOARD_META_SUMMARY.md`
- **Questions**: Contact the development team

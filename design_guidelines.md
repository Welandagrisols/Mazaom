# Agrovet POS - Design Guidelines

## Authentication & Roles
**Auth**: Supabase email/password with role-based access (admin, cashier, manager)
- Auto-logout after inactivity
- Login: email/password fields, "Remember me" toggle, forgot password link
- Profile: user info, change password, activity log, logout confirmation, settings (admin only)

## Navigation Structure
**Tab Navigation**:
- **Cashier/Manager** (4 tabs): POS (Home), Inventory, Reports, More
- **Admin** (5 tabs): Add Admin tab (user management, system settings, audit logs)

**Modal Screens**: Receipt scanner, receipt review, transaction/product/customer details, report filters

## Screen Layouts

### POS (Home)
- **Header**: Transparent, cashier name + shift time (right)
- **Content**: Search bar with barcode scanner → Scrollable cart → Fixed checkout section
- **Safe Area**: top: headerHeight + 24px, bottom: tabBarHeight + 24px
- **Components**: Search/barcode button, cart items with +/- controls, "Checkout" FAB (64x64dp), top 8 product shortcuts

### Inventory
- **Header**: Default + search, "Scan Receipt" button (right)
- **Content**: Category chips (horizontal) → Low stock banner → Product grid/list (toggleable)
- **Safe Area**: top: headerHeight + 24px, bottom: tabBarHeight + 24px
- **Components**: Filter chips, product cards (image, name, stock, price), "Add Product" FAB (admin/manager), stock badges

### Receipt Scanner (Modal)
- **Header**: "Cancel" (left), "Capture" (right)
- **Content**: Full-screen camera + guide overlay
- **Floating**: Camera controls, upload button, flash toggle (bottom: insets.bottom + 24px)

### Receipt Review (Modal)
- **Header**: "Cancel" (left), "Confirm All" (right)
- **Content**: Two columns (tablet/desktop) - Receipt image (left, zoomable) + Editable data table (right)
- **Safe Area**: top: headerHeight + 24px, bottom: insets.bottom + 24px
- **Components**: Confidence score (green >75%, yellow 50-75%, red <50%), editable fields, product dropdown, "Add new" button, confirm checkboxes

### Reports
- **Header**: Default + date range picker (right)
- **Content**: Metric cards → Charts → Report categories
- **Safe Area**: top: headerHeight + 24px, bottom: tabBarHeight + 24px
- **Components**: Metric cards, interactive charts, report type cards, export button

### Checkout (Modal)
- **Header**: "Cancel" (left), "Checkout" title
- **Content**: Order summary → Customer selection → Payment tabs (Cash/M-Pesa/Bank/Credit) → Amount input → Discount field
- **Safe Area**: top: headerHeight + 24px, bottom: insets.bottom + 24px
- **Submit**: Large "Complete Sale" button

### Profile/Settings
- **Header**: Default, "Profile" title
- **Content**: User card → Settings sections (Account, Preferences, About) → Admin section → Logout
- **Safe Area**: top: headerHeight + 24px, bottom: tabBarHeight + 24px

## Design Tokens

### Colors
**Primary**: `#2E7D32` (main), `#1B5E20` (dark), `#4CAF50` (light)
**Secondary**: `#1976D2` (main), `#0D47A1` (dark), `#42A5F5` (light)
**Accent**: Warning `#F57C00`, Error `#D32F2F`, Success `#388E3C`
**Light Mode**: Background `#FAFAFA`, Surface `#FFFFFF`, Text Primary `#212121`, Text Secondary `#757575`, Divider `#E0E0E0`
**Dark Mode**: Background `#121212`, Surface `#1E1E1E`, Text Primary `#FFFFFF`, Text Secondary `#B0B0B0`, Divider `#2C2C2C`

### Typography (SF/Roboto)
- **H1**: 28sp, Bold | **H2**: 24sp, Semibold | **H3**: 20sp, Semibold
- **Body Large**: 16sp, Regular | **Body**: 14sp, Regular | **Caption**: 12sp, Regular
- **Button**: 14sp, Medium, All Caps

### Spacing
xs: 4px | sm: 8px | md: 12px | lg: 16px | xl: 24px | 2xl: 32px | 3xl: 48px

### Touch Targets
**Minimum**: 48x48dp | **Preferred**: 56x56dp (primary) | **FAB**: 64x64dp (16dp margin)

## Components

### Cards
Background: Surface, radius: 12px, elevation: 2dp, padding: 16px

### Buttons
- **Primary**: Filled, Primary Green, white text, 12px radius, 48px height, 24px h-padding
- **Secondary**: Outlined, Primary Green border/text, 12px radius
- **Text**: No background, Primary Green text

### Inputs
Outlined, 8px radius, 56px height, label 12sp Text Secondary
- Active: Primary Blue 2px | Inactive: Divider 1px | Error: Error Red 2px

### Search Bar
Surface background, 24px radius (pill), 48px height, search icon (left 20x20dp), barcode icon (right 24x24dp)

### FAB
64x64dp, Primary Green, white icon (24x24dp), bottom-right 16dp from edges
- Shadow on press: offset (0, 2), opacity 0.10, radius 2

### Stock Badges
16px height pills:
- In Stock: `#E8F5E9` bg, green text
- Low Stock: `#FFF3E0` bg, orange text
- Out of Stock: `#FFEBEE` bg, red text
- Expiring Soon: `#FFFDE7` bg, orange text

### Charts
Primary Green (main data), Secondary Blue (comparisons), 3px lines, `#E0E0E0` grid, interactive tooltips

## Visual Feedback

### Touch States
- Buttons: Scale 0.96, 100ms
- Cards: Opacity 0.9 + ripple (Android)
- List items: `#F5F5F5` background

### Loading
Skeleton screens (initial), inline spinners 16x16dp (actions), full-screen with message (critical)

### Notifications
Top toasts, 4s duration:
- Success: Green bg, white text, checkmark
- Error: Red bg, white text, alert icon
- Info: Blue bg, white text, info icon

## Interactions
- **Swipe**: Left on items → reveal delete
- **Pull to Refresh**: All lists
- **Long Press**: Products → quick edit stock
- **Confirmations**: All destructive actions (red "Delete" button)
- **Offline**: Yellow banner at top

## Accessibility
- **Contrast**: WCAG AAA (7:1) in high contrast mode
- **Scaling**: Support up to 200% dynamic type
- **Focus**: 3px blue outline for keyboard navigation
- **Touch Targets**: 48x48dp minimum enforced
- **Screen Readers**: Labels on all interactive elements
- **Errors**: Include icons, not color-only

## Assets

### Custom (Generate)
1. **App Icon**: Minimalist barn/farm, green palette
2. **Category Icons** (outlined style, 8 icons): Feeds (grain), Fertilizers (plant+droplets), Pesticides (spray), Herbicides (weed+X), Veterinary (cross+paw), Seeds (packet), Poultry (chicken), Livestock (cow)
3. **Empty States** (3 minimal): Empty cart, No products (box+magnifier), No transactions (receipt+check)
4. **Onboarding** (3 screens): Scan receipts, Track inventory, Fast checkout

### System Icons
Use Feather icons (@expo/vector-icons) for all UI actions

---

**Token Count**: ~1,950 tokens | **Optimized for**: Developer implementation with preserved critical specs
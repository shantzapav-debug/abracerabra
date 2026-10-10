# Set up the Abracerabra sheet buttons

You do this once. After that, the website reads new products from the sheet, and the Leads tab can email a private delivery form. You do not need to edit the website code.

The sheet is **Abracerabra RFQ CMS**.

## 1. Open the script editor

1. Open the sheet.
2. Click **Extensions**.
3. Click **Apps Script**.
4. If a file named `Code.gs` is already there, select all of its text and delete it.
5. Open `Code.gs` from the `apps-script` folder in the website project. Select all of it, copy it, and paste it into the editor.
6. In the left sidebar, click the gear **Project Settings**.
7. Tick **Show "appsscript.json" manifest file in editor**.
8. Open `appsscript.json` in the editor. Replace its contents with the `appsscript.json` file from the same `apps-script` folder.
9. Click the disk icon (Save).

## 2. Run setup

1. At the top of the editor, the function list says `onOpen`. Change it to **setup**.
2. Click **Run**.
3. Google asks for permission. Click **Review permissions**, choose your Google account, then **Advanced** → **Go to Abracerabra (unsafe)** if that warning appears, then **Allow**.
   The script needs the spreadsheet, Gmail (to send the delivery link from your account), and Drive (to make a product photo viewable by anyone with the link).
4. A box appears titled **Abracerabra setup**. It shows two long codes. Leave that box open.

Copy them somewhere safe, such as a note only you can see:

| In the box | Paste into Vercel as |
| --- | --- |
| `LOGISTICS_LINK_SECRET` | `LOGISTICS_LINK_SECRET` |
| `APP_SHARED_SECRET` | `APP_SHARED_SECRET` |

If you closed the box, run **setup** again. It keeps the same codes and shows them again. They are also under **Executions** (the clock icon) in the log.

Setup adds:

- A **Settings** tab. The email subject and email body live here. You can edit them later.
- On **Leads**, two columns at the end: `link_sent_at`, `link_sent_by`.
- On **Logistics**, columns at the end: `country`, `preferred_delivery_date`, `contact_person`, `contact_phone`, `notes`.
- On **Products**, columns at the end: `status`, `published_at`, `message`.

Existing columns stay in the same order. You may already see a column of the word **Done** with no heading. Leave it. Do not rename it to `status`. Blank `status` means the product is already on the website.

## 3. Deploy the web app

The website reads products, and saves delivery forms, through this web app.

1. Top right, click **Deploy** → **New deployment**.
2. Click the gear next to **Select type** → **Web app**.
3. Description: `Abracerabra catalog and logistics`.
4. **Execute as:** Me.
5. **Who has access:** Anyone.
6. Click **Deploy**. Approve access if Google asks again.
7. Copy the **Web app URL**. It ends in `/exec`.
   If the URL ends in `/dev`, that is only a test. Go back and use **New deployment**, not **Test deployments**.

Paste that URL into Vercel as `SHEETS_APP_URL`.

## 4. Put the three values in Vercel

In the Vercel project: **Settings → Environment Variables**. Add them for Production (and Preview if you use preview sites):

| Name | Value |
| --- | --- |
| `SHEETS_APP_URL` | The web app URL ending in `/exec` |
| `APP_SHARED_SECRET` | From the setup box |
| `LOGISTICS_LINK_SECRET` | From the setup box |
| `WEBHOOK_SENDER_KEY` | Already in use for new quote leads. Leave it as it is. |

Do not put these values in the website files or in email.

Click **Save**, then **Deployments** → the latest deployment → **Redeploy**. New variables are not used until you redeploy.

## 5. Show the menu

1. Close the Apps Script tab and reload the spreadsheet.
2. A menu named **Abracerabra** appears next to Help.
3. If it is missing, reload once more. The first time you click an item, Google may ask you to allow the script again.

## 6. Optional buttons on the sheet

The menu is enough. A drawing button runs the same action.

**Send logistics link**

1. Click a lead’s row on the **Leads** tab (not the header).
2. **Insert** → **Drawing**.
3. Draw a shape and type `Send logistics link to selected lead`.
4. **Save and Close**.
5. Click the drawing. At the top right of it, click the three dots → **Assign script**.
6. Type exactly: `sendLogisticsLinkToSelectedLead`
7. Click **OK**.

**Publish products**

1. On the **Products** tab, **Insert** → **Drawing**.
2. Label it `Publish selected products`.
3. Assign the script: `publishSelectedProducts`

Click the lead row or the product rows first, then the drawing. Clicking the drawing does not change which row is selected.

## 7. Email a delivery link

1. Open **Leads**.
2. Click one cell in the lead’s row. The row must have an email address.
3. **Abracerabra** → **Send logistics link to selected lead** (or the drawing).
4. A box shows the recipient. Click **OK** to send, or **Cancel** to stop.
5. If the email cell is empty, nothing is sent.
6. The message comes from the Gmail account of the person who clicked.
7. The sheet then sets status to `Logistics link sent` and fills `link_sent_at` and `link_sent_by`.

The email subject and the HTML body are in the **Settings** tab, cells next to `email_subject` and `email_html`. You can change the words. These placeholders are replaced when the email is sent:

- `{{name}}`
- `{{ref}}`
- `{{link}}`
- `{{lead_id}}`

`site_base_url` should stay `https://abracerabraweb.vercel.app` with no slash at the end, unless the site address changes.

The customer opens a private page. It is not in the site menu. If the link is wrong, they see **Invalid or expired link** and no form. When they submit, the **Logistics** tab gains a row, or the same lead’s row is updated if they submit again. The lead’s status becomes `Logistics received`.

## 8. Publish products

1. On **Products**, fill `name`, `category`, `image`, `moq`, `unit`, and `indicativePrice`. Prices stay in INR.
2. Leave `id` blank if you want one created for you (a short name plus a few characters).
3. `image` can be a normal `https://` picture address, a Google Drive share link, or a Drive file id.
4. Select the rows. **Abracerabra** → **Publish selected products**.
5. Or, with nothing in particular selected, **Publish all ready rows**. That publishes rows whose status is empty, `Draft`, or `Error`. Rows already marked `Published` are left as they are.
6. A good row becomes `Published`, `published_at` is filled, and a Drive photo is changed to “anyone with the link can view” when your Google account is allowed to change that file. The cell is rewritten to a direct image address.
7. A row missing a required field becomes `Error`. Read the `message` column, fix the cells, and publish that row again.
8. Set status to `Draft` to hide a product. Empty status and `Published` both show on the website. Within about a minute, the catalog and the product menu show the new product. A new word in `category` becomes a new category by itself.

## 9. Optional check

In Apps Script, choose the function **selfTestTokens**, click **Run**, and open the log. It should say `token vectors ok (3)`. That confirms the private-link code matches the website. You do not need to do this to send mail.

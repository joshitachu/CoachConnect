import graphviz

# Create a new directed graph
dot = graphviz.Digraph('ERD', comment='CoachConnect ERD', format='png')

# Set graph attributes for better layout
dot.attr(rankdir='LR', splines='ortho', nodesep='0.6', ranksep='1.0', fontname='Arial')
dot.attr('node', shape='plaintext', fontname='Arial')

# Define Tables using HTML-like labels for clarity

# Trainer User
dot.node('TRAINER', '''<
<table border="0" cellborder="1" cellspacing="0" cellpadding="4">
  <tr><td bgcolor="#E0E0E0"><b>trainer_user</b></td></tr>
  <tr><td port="id" align="left">PK id (integer)</td></tr>
  <tr><td port="code" align="left">UK trainers_code (varchar)</td></tr>
  <tr><td align="left">first_name</td></tr>
  <tr><td align="left">last_name</td></tr>
  <tr><td align="left">email</td></tr>
  <tr><td align="left">password</td></tr>
</table>
>''')

# Client User
dot.node('CLIENT', '''<
<table border="0" cellborder="1" cellspacing="0" cellpadding="4">
  <tr><td bgcolor="#E0E0E0"><b>client_user</b></td></tr>
  <tr><td port="id" align="left">PK id (integer)</td></tr>
  <tr><td align="left">first_name</td></tr>
  <tr><td align="left">last_name</td></tr>
  <tr><td align="left">email</td></tr>
  <tr><td align="left">password</td></tr>
  <tr><td align="left">country</td></tr>
</table>
>''')

# Client Trainer Link
dot.node('LINK', '''<
<table border="0" cellborder="1" cellspacing="0" cellpadding="4">
  <tr><td bgcolor="#FFF8DC"><b>client_trainer</b></td></tr>
  <tr><td port="cid" align="left">FK client_id</td></tr>
  <tr><td port="tcode" align="left">FK trainers_code</td></tr>
  <tr><td align="left">linked_at</td></tr>
</table>
>''')

# Onboarding Forms (Templates)
dot.node('FORMS', '''<
<table border="0" cellborder="1" cellspacing="0" cellpadding="4">
  <tr><td bgcolor="#E6E6FA"><b>onboarding_forms</b></td></tr>
  <tr><td port="id" align="left">PK id</td></tr>
  <tr><td port="tcode" align="left">FK trainers_code</td></tr>
  <tr><td align="left">title</td></tr>
  <tr><td align="left">description</td></tr>
  <tr><td align="left">form_schema_json</td></tr>
</table>
>''')

# Client Filled Forms
dot.node('FILLED_FORMS', '''<
<table border="0" cellborder="1" cellspacing="0" cellpadding="4">
  <tr><td bgcolor="#E6E6FA"><b>client_onboarding_form</b></td></tr>
  <tr><td port="id" align="left">PK id</td></tr>
  <tr><td port="cid" align="left">FK client_id</td></tr>
  <tr><td port="tcode" align="left">FK trainers_code</td></tr>
  <tr><td align="left">assigned_at</td></tr>
  <tr><td align="left">form_data (json)</td></tr>
</table>
>''')

# Food Intake
dot.node('FOOD', '''<
<table border="0" cellborder="1" cellspacing="0" cellpadding="4">
  <tr><td bgcolor="#F0FFF0"><b>daily_food_intake</b></td></tr>
  <tr><td port="id" align="left">PK id</td></tr>
  <tr><td port="uid" align="left">FK user_id</td></tr>
  <tr><td align="left">product_name</td></tr>
  <tr><td align="left">macros (carbs/prot/fat)</td></tr>
  <tr><td align="left">quantity_grams</td></tr>
</table>
>''')

# Create Edges (Relationships)

# Trainer -> Link
dot.edge('TRAINER:code', 'LINK:tcode', label='1:N', color='#555555')
# Client -> Link
dot.edge('CLIENT:id', 'LINK:cid', label='1:N', color='#555555')

# Trainer -> Forms (Templates)
dot.edge('TRAINER:code', 'FORMS:tcode', label='creates', color='#555555')

# Relationships for Filled Forms
dot.edge('CLIENT:id', 'FILLED_FORMS:cid', label='fills', color='#555555')
dot.edge('TRAINER:code', 'FILLED_FORMS:tcode', label='reviews', color='#555555')

# Client -> Food
dot.edge('CLIENT:id', 'FOOD:uid', label='logs', color='#555555')

# Render the graph
dot.render('erd_improved')
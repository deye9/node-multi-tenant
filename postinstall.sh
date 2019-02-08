#!/bin/sh

CURRENT_DIR="`cd $1; pwd`";
destinationPath="${INIT_CWD// /\\ }";
finalPath="${destinationPath/$CURRENT_DIR/~}";

echo 'Changing over to the database directory.';
cd './database';

# Create a tenants folder in the migrations folder.
echo "Attempting to create a tenants folder in the Migrations folder.";
mkdir -p ~/Desktop/Projects/Node\ Apps/ESB/database/migrations/tenants;

# Move all existing migrations to the tenants folder.
echo "Moving all existing migration files to the tenants folder.";
mv ~/Desktop/Projects/Node\ Apps/ESB/database/migrations/*.js ~/Desktop/Projects/Node\ Apps/ESB/database/migrations/tenants

# copy each file/dir to user dir(~/)
 for node in `ls`
  do
    path=$finalPath'/database/'$node;
    echo 'Copying' './database/'$node 'over to '$path;
    cp -R $node/*.js ~/Desktop/Projects/Node\ Apps/ESB/database/$node;

    # cp -R ~/Desktop/Projects/Node\ Apps/node_multi_tenant/database/$node/ ~/Desktop/Projects/Node\ Apps/ESB/database/$node;
 done


cd '..'
echo 'Exited the database directory';

#  echo $(pwd);
# chmod +x postinstall.sh
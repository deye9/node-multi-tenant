#!/bin/sh

CURRENT_DIR="`cd $1; pwd`";
destinationPath="${INIT_CWD// /\\ }";
finalPath="${destinationPath/$CURRENT_DIR/}";

echo 'Changing over to the database directory.';
cd './database';

# echo "Attempting to create a tenants folder in the Migrations folder.";
# mkdir -p ~/$finalPath/database/migrations/tenants;

# echo "Moving all existing migration files to the tenants folder.";
# mv ~/$finalPath/database/migrations/*.js ~/$finalPath/database/migrations/tenants

# copy each file/dir to user dir(~/)
 for node in `ls`
  do

    echo 'Copying' './database/'$node 'over to ~'$finalPath'/database/'$node;
    cp -R $node/*.js ~/$finalPath/database/$node;

 done


cd '..'
echo 'Exited the database directory';

# chmod +x postinstall.sh
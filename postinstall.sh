#!/bin/sh

CURRENT_DIR="`cd $1; pwd`";
destinationPath="${INIT_CWD// /\\ }";
finalPath="${destinationPath/$CURRENT_DIR/}";

echo 'Changing over to the Distribution directory.';
cd './dist';

echo "Attempting to create a tenants folder in the root directory [~$finalPath/tenants]";
mkdir -p ~/$finalPath/tenants;

echo "Copying over the config file to the newly created tenants folder."
cp -R config/tenancy.js ~/$finalPath/tenants;

# echo "Attempting to create a tenants folder in the Migrations folder.";
# mkdir -p ~/$finalPath/dist/migrations/tenants;

# echo "Moving all existing migration files to the tenants folder.";
# mv ~/$finalPath/dist/migrations/*.js ~/$finalPath/dist/migrations/tenants

# # copy each file/dir to user dir(~/)
#  for node in `ls`
#   do

#     echo 'Copying' './dist/'$node 'over to ~'$finalPath'/dist/'$node;
#     cp -R $node/*.js ~/$finalPath/dist/$node;

#  done


cd '..'
echo 'Exited the Distribution directory';

# chmod +x postinstall.sh
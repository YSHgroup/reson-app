#!/bin/sh

export OLD_ADDR="andrew.dev.3263@gmail.com"
export OLD_NAME="andrew-dev-3263"
export NEW_ADDR="david.dev100@outlook.com"
export NEW_NAME="YSHgroup"
git filter-branch --env-filter '
    if test "$GIT_AUTHOR_EMAIL" = "$OLD_ADDR"
    then
        GIT_AUTHOR_EMAIL=$NEW_ADDR
    fi
    if test "$GIT_AUTHOR_NAME" = "$OLD_NAME"
    then
        GIT_AUTHOR_NAME=$NEW_NAME
    fi
    if test "$GIT_COMMITTER_EMAIL" = "$OLD_ADDR"
    then
        GIT_COMMITTER_EMAIL=$NEW_ADDR
    fi
    if test "$GIT_COMMITTER_NAME" = "$OLD_NAME"
    then
        GIT_COMMITTER_NAME=$NEW_NAME
    fi
' HEAD
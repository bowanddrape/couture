expect <<- DONE
spawn sudo -u postgres psql 
        expect "*#"
        send -- "ALTER ROLE root WITH PASSWORD 'password';\r"
        send -- "\x04"
        expect eof
DONE

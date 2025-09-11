<script>import Icon from '../Icon.svelte';
const iconNode = [["path", { "d": "m8 3 4 8 5-5 5 15H2L8 3z" }]];
</script>

<Icon name="mountain" {...$$props} iconNode={iconNode}>
  <slot/>
</Icon>
